import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import colors from '../utils/colors';
import { buildVespa } from './vespaModel';
import { MAX_HEIGHT_SHARE, MODEL_HEIGHT, MODEL_LENGTH } from './scooterBox';

export const STAGE_FOV = 28;
export const STAGE_CAMERA_Z = 14;

function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const rgba = (hex, a) => {
  const c = new THREE.Color().setStyle(hex, THREE.SRGBColorSpace);
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${a})`;
};

/**
 * Shared studio for the scooter: camera, warm lights, environment
 * reflections, gold floor glow and contact shadow, plus the rig that places
 * the scooter by a normalised "pose". Used by the background stage and the
 * intro so both look identical.
 */
export class ScooterStudio {
  constructor({ gl, scene, camera }) {
    this.gl = gl;
    this.scene = scene;
    this.camera = camera;
    this.group = new THREE.Group();
    this.rig = new THREE.Group();
    this.lean = new THREE.Group();
    this.rig.add(this.lean);
    this.vespa = null;
    this.halfWidth = 1;
    this.halfHeight = 1;
    this.scale = 1;

    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    camera.fov = STAGE_FOV;
    camera.near = 0.1;
    camera.far = 100;
    camera.position.set(0, 0, STAGE_CAMERA_Z);
    camera.lookAt(0, 0, 0);

    this.pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    this.envMap = this.pmrem.fromScene(room, 0.04).texture;
    room.traverse((n) => {
      n.geometry?.dispose();
      n.material?.dispose?.();
    });
    scene.environment = this.envMap;
    scene.environmentIntensity = 0.95;

    const key = new THREE.DirectionalLight(colors.light.key, 3.2);
    key.position.set(4, 7, 8);
    const rim = new THREE.DirectionalLight(colors.light.rim, 3);
    rim.position.set(-6, 3, -4);
    const under = new THREE.PointLight(colors.light.under, 26, 0, 2);
    under.position.set(0, -0.6, 3.2);
    this.group.add(key, rim, under, new THREE.AmbientLight(colors.light.ambient, 0.12));

    const plane = new THREE.PlaneGeometry(1, 1);
    plane.rotateX(-Math.PI / 2);
    this.plane = plane;
    this.glowTex = radialTexture([
      [0, rgba(colors.light.rim, 1)],
      [0.5, rgba(colors.gold.base, 0.35)],
      [1, rgba(colors.gold.base, 0)],
    ]);
    this.shadowTex = radialTexture([
      [0, 'rgba(0,0,0,0.75)'],
      [1, 'rgba(0,0,0,0)'],
    ]);
    this.glow = new THREE.Mesh(
      plane,
      new THREE.MeshBasicMaterial({
        map: this.glowTex,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.shadow = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false }));
    this.group.add(this.glow, this.shadow, this.rig);
  }

  setScene(gltfScene) {
    this.vespa = buildVespa(gltfScene);
    this.lean.add(this.vespa.root);
    return this.vespa;
  }

  resize(width, height) {
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.halfHeight = STAGE_CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(STAGE_FOV / 2));
    this.halfWidth = this.halfHeight * this.camera.aspect;
  }

  /** Place the rig for a pose; returns world x and scale. */
  place({ nx, ny, size, rotY }, parallax = 0) {
    const s = Math.min((size * 2 * this.halfWidth) / MODEL_LENGTH, (MAX_HEIGHT_SHARE * 2 * this.halfHeight) / MODEL_HEIGHT);
    const x = nx * this.halfWidth;
    const y = ny * this.halfHeight;
    this.scale = s;
    this.rig.position.set(x, y, 0);
    this.rig.scale.setScalar(s);
    this.rig.rotation.y = rotY + parallax;
    this.shadow.position.set(x, y + 0.02, 0);
    this.shadow.scale.set(s * 5.2, 1, s * 1.5);
    this.glow.position.set(x, y + 0.01, 0);
    this.glow.scale.set(s * 7.5, 1, s * 2.4);
    return { x, y, s };
  }

  /** Map a screen point (CSS px) to the z = 0 plane. */
  screenToWorld(px, py, width, height, out = new THREE.Vector3()) {
    // Build the ray from two unprojected points so both come from the same
    // camera matrix (camera.position may already hold this frame's shake).
    const x = (px / width) * 2 - 1;
    const y = -(py / height) * 2 + 1;
    this.camera.updateMatrixWorld();
    const near = new THREE.Vector3(x, y, -1).unproject(this.camera);
    const far = new THREE.Vector3(x, y, 1).unproject(this.camera);
    const t = near.z / (near.z - far.z);
    return out.copy(near).lerp(far, t);
  }

  dispose() {
    if (this.scene.environment === this.envMap) this.scene.environment = null;
    this.envMap.dispose();
    this.pmrem.dispose();
    this.vespa?.dispose();
    this.plane.dispose();
    this.glow.material.dispose();
    this.shadow.material.dispose();
    this.glowTex.dispose();
    this.shadowTex.dispose();
    this.group.clear();
  }
}

/**
 * Background stage behaviour (reference site): wheels roll with horizontal
 * motion, the body pitches on acceleration, a spring "bump" on landing, idle
 * float, and a subtle camera shake.
 */
export class StageMotion {
  constructor(studio) {
    this.studio = studio;
    this.lastX = null;
    this.lastSpeed = 0;
    this.pitch = 0;
    this.bounce = 0;
    this.bounceVelocity = 0;
    this.shake = 0;
  }

  hit(strength = 1) {
    this.bounceVelocity -= strength * 1.3;
    this.shake = Math.max(this.shake, strength);
  }

  update(dt, t, pose, parallax = 0) {
    const studio = this.studio;
    if (!studio.vespa) return;
    const spin = pose.spin || 0;
    const { x, s } = studio.place(spin ? { ...pose, rotY: pose.rotY + spin } : pose, parallax);
    const heading = pose.rotY + parallax;
    if (this.lastX !== null && dt > 0) {
      const dirX = Math.sin(heading);
      const roll = ((x - this.lastX) * dirX) / ((studio.vespa.wheels[0]?.radius || 0.54) * s);
      for (const w of studio.vespa.wheels) w.spinner.rotation.x += roll;
      const speed = (x - this.lastX) / dt;
      const accel = Math.abs(this.lastSpeed) - Math.abs(speed);
      const target = THREE.MathUtils.clamp(accel * 6e-4 * 60, -0.09, 0.09);
      this.pitch += (target * Math.sign(dirX) - this.pitch) * 0.12;
      this.lastSpeed = speed;
    }
    this.lastX = x;

    const step = Math.min(dt, 0.05);
    this.bounceVelocity += (-120 * this.bounce - 7 * this.bounceVelocity) * step;
    this.bounce += this.bounceVelocity * step;
    this.shake *= Math.exp(-7 * step);
    const cam = studio.camera;
    cam.position.set((Math.random() - 0.5) * this.shake * 0.14, (Math.random() - 0.5) * this.shake * 0.14, STAGE_CAMERA_Z);

    const moving = Math.abs(this.lastSpeed);
    const idle = moving < 0.5 ? Math.sin(t * 38) * 0.004 : 0;
    studio.lean.position.y = idle + this.bounce + Math.sin(t * 1.6) * 0.012 * (1 - Math.min(moving, 1));
    studio.lean.rotation.z = this.pitch;
    studio.lean.rotation.x = -(pose.air || 0); // nose-up while airborne (model faces +z)
  }
}
