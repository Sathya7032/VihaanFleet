import * as THREE from 'three';
import colors from '../../utils/colors';
import { MODEL_HEIGHT, MODEL_LENGTH } from '../../three/vespaModel';
import { ScooterStudio, StageMotion } from '../../three/stageEngine';
import { sampleV } from '../brand/vMark';
import { PARTICLES, SCOOTER_SIZE, TIMELINE } from './introConfig';
import { VSwarm } from './particleSwarm';
import { clamp01, easeInOutCubic, easeOutCubic, prepareParts, samplePartSurfaces } from './sceneUtils';

const START_NX = -1.75; // just off the left edge
const HEADING_RIGHT = Math.PI / 2;
const SEPARATE_SECONDS = 0.55;
const SPREAD = 1.35; // dismantle distance multiplier
const STAGGER = 0.4;

/** Cruise, then a smooth cosine brake to a full stop. Returns 0..1 of the distance. */
const CRUISE = 0.45;
const driveProfile = (u) => {
  const total = CRUISE + 0.5 * (1 - CRUISE);
  if (u <= CRUISE) return u / total;
  const b = (u - CRUISE) / (1 - CRUISE);
  return (CRUISE + 0.5 * (1 - CRUISE) * b + ((1 - CRUISE) / (2 * Math.PI)) * Math.sin(Math.PI * b)) / total;
};

/**
 * Imperative intro scene. Uses the same studio (lights, reflections, gold
 * floor glow) and the same cream & gold Vespa as the homepage stage.
 */
export class IntroEngine {
  constructor({ gl, scene, camera, isMobile }) {
    this.isMobile = isMobile;
    this.studio = new ScooterStudio({ gl, scene, camera });
    this.motion = new StageMotion(this.studio);
    this.group = this.studio.group;
    this.gl = gl;
    this.scene = scene;
    this.camera = camera;
    this.ready = false;
    this.hitDone = false;
    this.lastNow = null;
    this.pose = { nx: START_NX, ny: 0, size: isMobile ? SCOOTER_SIZE.mobile : SCOOTER_SIZE.desktop, rotY: HEADING_RIGHT };
    this.swarm = new VSwarm({
      count: isMobile ? PARTICLES.mobile : PARTICLES.desktop,
      colors: [colors.gold.light, colors.gold.base, colors.gold.deep],
    });
    this.group.add(this.swarm.group);
    this.tmp = new THREE.Vector3();
  }

  setScene(gltfScene) {
    const vespa = this.studio.setScene(gltfScene);
    prepareParts(vespa.parts); // per-part materials with alpha-hash dissolve
    this.vespa = vespa;
  }

  /** Vertical position that centres the scooter on screen. */
  centredNy() {
    const st = this.studio;
    const s = Math.min((this.pose.size * 2 * st.halfWidth) / MODEL_LENGTH, (0.34 * 2 * st.halfHeight) / MODEL_HEIGHT);
    return -((MODEL_HEIGHT * 0.5 * s) / st.halfHeight);
  }

  partWindow(order) {
    const start = TIMELINE.dismantleStart + order * STAGGER;
    const fadeStart = start + 0.32; // let each component visibly fly apart first
    const fadeDur = Math.max(0.15, TIMELINE.dismantleEnd - (TIMELINE.dismantleStart + STAGGER + 0.32));
    return { start, fadeStart, fadeDur };
  }

  /** Map points sampled inside the on-screen V (DOM rect) onto the z = 0 plane. */
  assignTargets(vRect, width, height) {
    const n = this.swarm.count;
    const tile = sampleV(n);
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      const px = vRect.left + (tile[i * 2] / 40) * vRect.width;
      const py = vRect.top + (tile[i * 2 + 1] / 40) * vRect.height;
      this.studio.screenToWorld(px, py, width, height, this.tmp);
      out[i * 3] = this.tmp.x;
      out[i * 3 + 1] = this.tmp.y;
      out[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    this.swarm.setTargets(out);
  }

  /** Screen y of the ground under the wheels (for the gold road line in the DOM). */
  report(ref, height) {
    if (!ref) return;
    this.tmp.set(0, this.studio.rig.position.y, 0).project(this.camera);
    ref.current = { groundY: ((1 - this.tmp.y) / 2) * height };
  }

  /** Called every animation frame. Returns true once, when ready to start. */
  frame({ width, height, dpr, startTime, vRect, report }) {
    const vespa = this.vespa;
    if (!vespa) return false;
    const st = this.studio;
    st.resize(width, height);
    this.pose.ny = this.centredNy();
    const now = performance.now();
    const dt = this.lastNow == null ? 0 : Math.min(0.1, (now - this.lastNow) / 1000);
    this.lastNow = now;

    if (!this.ready) {
      this.pose.nx = START_NX;
      this.motion.update(0, 0, this.pose);
      st.group.updateMatrixWorld(true);
      const samples = samplePartSurfaces(vespa.parts, this.swarm.count);
      const release = new Float32Array(this.swarm.count);
      for (let i = 0; i < this.swarm.count; i += 1) {
        const w = this.partWindow(vespa.parts[samples.part[i]].order);
        release[i] = w.fadeStart + Math.random() * w.fadeDur;
      }
      this.swarm.init({ ...samples, release });
      this.partMatrices = vespa.parts.map((p) => p.object.matrixWorld);
      this.gl.compile(this.scene, this.camera);
      this.report(report, height);
      this.ready = true;
      return true;
    }
    if (startTime == null) return false;
    const t = (now - startTime) / 1000;

    // 1) Straight line from the left-centre to the centre: cruise, brake, stop.
    const u = clamp01(t / TIMELINE.driveEnd);
    this.pose.nx = START_NX * (1 - driveProfile(u));
    if (!this.hitDone && u >= 1) {
      this.hitDone = true;
      this.motion.hit(0.55);
    }
    this.motion.update(dt, t, this.pose);
    this.report(report, height);

    // 2) Dismantle: subtle loosening, then each component flies out in order.
    const loosen = easeOutCubic(clamp01((t - TIMELINE.dismantleStart) / 0.2)) * 0.06;
    for (const part of vespa.parts) {
      const w = this.partWindow(part.order);
      const p = easeInOutCubic(clamp01((t - w.start) / SEPARATE_SECONDS));
      const sep = loosen + 0.94 * p;
      const o = part.object;
      o.position.set(
        part.basePosition.x + part.offset.x * sep * SPREAD,
        part.basePosition.y + part.offset.y * sep * SPREAD,
        part.basePosition.z + part.offset.z * sep * SPREAD
      );
      o.rotation.set(
        part.baseRotation.x + part.rot.x * p,
        part.baseRotation.y + part.rot.y * p,
        part.baseRotation.z + part.rot.z * p
      );
      const fade = 1 - clamp01((t - w.fadeStart) / w.fadeDur);
      for (const m of part.materials) m.opacity = fade;
      o.visible = fade > 0;
    }
    const intact = 1 - clamp01((t - TIMELINE.dismantleStart) / 0.6);
    st.glow.material.opacity = 0.42 * Math.max(intact, 0.35 * (1 - clamp01((t - TIMELINE.vFormed) / 0.4)));
    st.shadow.material.opacity = intact;

    // 3) Particles: assign V destinations from the DOM, then fly.
    if (!this.swarm.hasTargets && t >= TIMELINE.dismantleStart - 0.1 && vRect) {
      this.assignTargets(vRect, width, height);
    }
    st.group.updateMatrixWorld(true);
    this.swarm.update(t, this.partMatrices, height * dpr);
    return false;
  }

  dispose() {
    this.swarm.dispose();
    this.vespa?.parts.forEach((p) => p.materials?.forEach((m) => m.dispose()));
    this.studio.dispose();
  }
}
