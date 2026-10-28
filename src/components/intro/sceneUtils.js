import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t) => t * t * t;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Normalise a list of parts: record each part's rest pose, give every part
 * its own materials (so parts can fade independently) and enable alphaHash,
 * which makes a part dissolve as dithered dots instead of a flat fade. It
 * also keeps the scooter in the opaque render pass, so no sorting artefacts.
 */
export function prepareParts(parts) {
  parts.forEach((part, index) => {
    part.basePosition = part.object.position.clone();
    part.baseRotation = part.object.rotation.clone();
    part.order = part.order ?? Math.min(0.9, index * 0.05);
    part.materials = [];
    part.meshes = [];
    const cloned = new Map();
    part.object.traverse((node) => {
      if (!node.isMesh) return;
      part.meshes.push(node);
      const swap = (m) => {
        if (!cloned.has(m)) {
          const c = m.clone();
          c.alphaHash = true;
          c.transparent = false;
          cloned.set(m, c);
          part.materials.push(c);
        }
        return cloned.get(m);
      };
      node.material = Array.isArray(node.material) ? node.material.map(swap) : swap(node.material);
    });
    // Originals are never rendered; free them (textures stay shared with the clones).
    cloned.forEach((_, original) => original.dispose());
  });
  return parts;
}

/**
 * Sample `count` points on the surfaces of all parts and express each one in
 * its part's local space, so a particle can ride along with a moving part.
 * Points are distributed by surface area. Call with parts in their rest pose.
 */
export function samplePartSurfaces(parts, count) {
  const entries = [];
  const scale = new THREE.Vector3();
  parts.forEach((p, partIndex) => {
    p.object.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(p.object.matrixWorld).invert();
    p.meshes.forEach((mesh) => {
      const geo = mesh.geometry;
      if (!geo?.attributes?.position || geo.attributes.position.count < 3) return;
      try {
        const sampler = new MeshSurfaceSampler(mesh).build();
        mesh.getWorldScale(scale);
        const area = sampler.distribution ? sampler.distribution[sampler.distribution.length - 1] : 1;
        const toPart = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
        entries.push({ sampler, toPart, partIndex, weight: Math.max(area * scale.x * scale.y, 1e-5) });
      } catch {
        /* non-triangle geometry: skip */
      }
    });
  });
  const part = new Uint16Array(count);
  const local = new Float32Array(count * 3);
  if (!entries.length) return { part, local };
  const total = entries.reduce((s, e) => s + e.weight, 0);
  const tmp = new THREE.Vector3();
  let i = 0;
  entries.forEach((e, k) => {
    // every component gets at least a few particles, even tiny ones
    const n = k === entries.length - 1 ? count - i : Math.max(4, Math.round((e.weight / total) * count));
    for (let j = 0; j < n && i < count; j += 1, i += 1) {
      e.sampler.sample(tmp);
      tmp.applyMatrix4(e.toPart);
      part[i] = e.partIndex;
      local[i * 3] = tmp.x;
      local[i * 3 + 1] = tmp.y;
      local[i * 3 + 2] = tmp.z;
    }
  });
  return { part, local };
}

/** Dispose every geometry, material and texture under `root`. */
export function disposeObject(root) {
  if (!root) return;
  root.traverse((node) => {
    if (node.geometry) node.geometry.dispose();
    const mats = node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
    mats.forEach((m) => {
      Object.values(m).forEach((v) => {
        if (v && v.isTexture) v.dispose();
      });
      m.dispose();
    });
  });
}

export function disposeParts(parts) {
  parts?.forEach((p) => p.materials?.forEach((m) => m.dispose()));
}
