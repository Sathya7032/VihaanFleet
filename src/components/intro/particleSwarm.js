import * as THREE from 'three';
import { TIMELINE } from './introConfig';
import { clamp01, easeInOutCubic, smoothstep } from './sceneUtils';

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aMix;
  uniform float uViewportHeight;
  varying float vAlpha;
  varying float vMix;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * projectionMatrix[1][1] * uViewportHeight * 0.5 / max(-mv.z, 0.001);
    vAlpha = aAlpha;
    vMix = aMix;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying float vAlpha;
  varying float vMix;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    glow *= glow;
    float core = smoothstep(0.17, 0.0, d);
    vec3 col = vMix < 0.5 ? mix(uColorA, uColorB, vMix * 2.0) : mix(uColorB, uColorC, vMix * 2.0 - 1.0);
    col = mix(col, vec3(1.0, 0.97, 0.88), core * 0.45);
    gl_FragColor = vec4(col, (glow + core) * vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const TRAIL = 0.07; // trail length, as a fraction of each particle's flight

/**
 * Gold particles that ride on the dismantling scooter parts, peel off as
 * each part dissolves, then fly along curved paths to assigned points inside
 * the "V" - assembling the monogram in mid-air. CPU-updated.
 */
export class VSwarm {
  constructor({ count, colors: [a, b, c] }) {
    this.count = count;
    this.ready = false;
    this.group = new THREE.Group();
    this.group.name = 'VSwarm';
    const n = count;
    this.part = new Uint16Array(n);
    this.local = new Float32Array(n * 3);
    this.release = new Float32Array(n);
    this.arrive = new Float32Array(n);
    this.origin = new Float32Array(n * 3);
    this.ctrl = new Float32Array(n * 3);
    this.target = new Float32Array(n * 3);
    this.captured = new Uint8Array(n);
    this.baseSize = new Float32Array(n);
    this.phase = new Float32Array(n);
    this.hasTargets = false;

    this.positions = new Float32Array(n * 3);
    this.alpha = new Float32Array(n);
    this.sizes = new Float32Array(n);
    const mix = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      mix[i] = Math.random();
      this.phase[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aMix', new THREE.BufferAttribute(mix, 1));
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColorA: { value: new THREE.Color(a) },
        uColorB: { value: new THREE.Color(b) },
        uColorC: { value: new THREE.Color(c) },
        uViewportHeight: { value: 800 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;

    const tGeo = new THREE.BufferGeometry();
    this.trailPos = new Float32Array(n * 6);
    this.trailCol = new Float32Array(n * 6);
    tGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3).setUsage(THREE.DynamicDrawUsage));
    tGeo.setAttribute('color', new THREE.BufferAttribute(this.trailCol, 3).setUsage(THREE.DynamicDrawUsage));
    // Pure additive light: colours are pre-scaled by alpha, and the canvas's
    // alpha channel is left untouched (otherwise faded, black trail segments
    // would stamp opaque dark pixels onto the transparent canvas).
    this.trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
    });
    this.trails = new THREE.LineSegments(tGeo, this.trailMaterial);
    this.trails.frustumCulled = false;
    this.trails.renderOrder = 9;
    this.trailColor = new THREE.Color(b);
    this.group.add(this.trails, this.points);
    this.setDrawCount(0);
    this._h = new THREE.Vector3();
  }

  setDrawCount(n) {
    this.points.geometry.setDrawRange(0, n);
    this.trails.geometry.setDrawRange(0, n * 2);
  }

  /** Where each particle starts (on which part, in that part's space) and when it lets go. */
  init({ part, local, release }) {
    const n = this.count;
    this.part.set(part.subarray(0, n));
    this.local.set(local.subarray(0, n * 3));
    this.release.set(release.subarray(0, n));
    for (let i = 0; i < n; i += 1) {
      this.baseSize[i] = 0.014 + Math.random() * 0.016;
      // everyone lands between 0.25 s before and exactly at vFormed
      this.arrive[i] = Math.max(this.release[i] + 0.45, TIMELINE.vFormed - Math.random() * 0.25);
    }
    this.captured.fill(0);
    this.setDrawCount(n);
    this.ready = true;
  }

  /** Destination points inside the V (world space, Float32Array n*3). */
  setTargets(points) {
    this.target.set(points.subarray(0, this.count * 3));
    this.hasTargets = true;
  }

  pathAt(i, u, out) {
    const k = i * 3;
    const e = easeInOutCubic(clamp01(u));
    const a = (1 - e) * (1 - e);
    const b = 2 * (1 - e) * e;
    const c = e * e;
    return out.set(
      a * this.origin[k] + b * this.ctrl[k] + c * this.target[k],
      a * this.origin[k + 1] + b * this.ctrl[k + 1] + c * this.target[k + 1],
      a * this.origin[k + 2] + b * this.ctrl[k + 2] + c * this.target[k + 2]
    );
  }

  update(t, partMatrices, viewportHeight) {
    this.material.uniforms.uViewportHeight.value = viewportHeight;
    if (!this.ready) return;
    const n = this.count;
    const h = this._h;
    const fadeOut = 1 - smoothstep(TIMELINE.markIn + 0.05, TIMELINE.markInEnd + 0.1, t);
    const tc = this.trailColor;
    for (let i = 0; i < n; i += 1) {
      const k = i * 3;
      const j = i * 6;
      const tau = t - this.release[i];
      if (tau < -0.05 || !this.hasTargets) {
        this.alpha[i] = 0;
        this.sizes[i] = 0;
        this.trailCol.fill(0, j, j + 6);
        continue;
      }
      if (!this.captured[i] || tau < 0) {
        h.set(this.local[k], this.local[k + 1], this.local[k + 2]).applyMatrix4(partMatrices[this.part[i]]);
        this.origin[k] = h.x;
        this.origin[k + 1] = h.y;
        this.origin[k + 2] = h.z;
        if (tau >= 0) {
          this.captured[i] = 1;
          // control point: midpoint pushed out sideways and up for a sweeping arc
          const dx = this.target[k] - h.x;
          const dy = this.target[k + 1] - h.y;
          const len = Math.hypot(dx, dy) || 1;
          const swirl = (Math.random() - 0.5) * 1.1 * len;
          this.ctrl[k] = (h.x + this.target[k]) / 2 - (dy / len) * swirl;
          this.ctrl[k + 1] = (h.y + this.target[k + 1]) / 2 + (dx / len) * swirl + len * 0.25;
          this.ctrl[k + 2] = (h.z + this.target[k + 2]) / 2 + (Math.random() - 0.5) * len * 0.6;
        }
      }
      const flight = Math.max(0.001, this.arrive[i] - this.release[i]);
      const u = Math.max(0, tau) / flight;
      this.pathAt(i, u, h);
      if (u >= 1) {
        // settled in the V: a faint shimmer
        h.x += Math.sin(t * 9 + this.phase[i]) * 0.003;
        h.y += Math.cos(t * 7 + this.phase[i]) * 0.003;
      }
      this.positions[k] = h.x;
      this.positions[k + 1] = h.y;
      this.positions[k + 2] = h.z;
      const a = smoothstep(-0.05, 0.04, tau) * fadeOut;
      this.alpha[i] = a;
      this.sizes[i] = this.baseSize[i] * (u >= 1 ? 1 : 1.3 - 0.3 * clamp01(u));

      const tailU = Math.max(0, u - TRAIL);
      const trailA = u > 0 && u < 1 ? a * 0.55 : 0;
      this.trailPos[j] = h.x;
      this.trailPos[j + 1] = h.y;
      this.trailPos[j + 2] = h.z;
      this.pathAt(i, tailU, h);
      this.trailPos[j + 3] = h.x;
      this.trailPos[j + 4] = h.y;
      this.trailPos[j + 5] = h.z;
      this.trailCol[j] = tc.r * trailA;
      this.trailCol[j + 1] = tc.g * trailA;
      this.trailCol[j + 2] = tc.b * trailA;
      this.trailCol[j + 3] = 0;
      this.trailCol[j + 4] = 0;
      this.trailCol[j + 5] = 0;
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    this.trails.geometry.attributes.position.needsUpdate = true;
    this.trails.geometry.attributes.color.needsUpdate = true;
  }

  dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
    this.trails.geometry.dispose();
    this.trailMaterial.dispose();
  }
}
