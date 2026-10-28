import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import colors from '../utils/colors';

/**
 * The site's 3D scooter: "Vespa" by Jasmine Roberts (Poly Pizza, CC BY 3.0),
 * recoloured cream + gold. public/models/scooter.glb is one mesh split only
 * by material, so this module rebuilds real components from its connected
 * pieces: two wheels (tyre + hub), seat, mirrors, handlebar + headlight,
 * gold side trims, tail pieces, and the body shell cut into front shield and
 * left/right panels. Model space: +z = front, +y = up, ~4.4 units long.
 */
export const MODEL_URL = '/models/scooter.glb';
export { MODEL_HEIGHT, MODEL_LENGTH } from './scooterBox';
const MODEL_OFFSET = new THREE.Vector3(0, 1.05, 0.53); // puts the tyres on y = 0

let cache = null;
export function loadVespaScene() {
  if (!cache) {
    cache = new GLTFLoader().loadAsync(MODEL_URL).then((g) => g.scene);
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

function makeMaterial(name, original) {
  switch (name) {
    case 'Material.001': // body
      return new THREE.MeshPhysicalMaterial({
        name,
        color: colors.scooter.body,
        metalness: 0.45,
        roughness: 0.26,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
      });
    case 'Material.003': // gold chrome
      return new THREE.MeshPhysicalMaterial({ name, color: colors.scooter.trim, metalness: 1, roughness: 0.2 });
    case 'Material.002': // tyres + seat
      return new THREE.MeshPhysicalMaterial({ name, color: colors.scooter.rubber, metalness: 0.1, roughness: 0.55 });
    case 'Material.004': // lamp
      return new THREE.MeshPhysicalMaterial({
        name,
        color: colors.scooter.lamp,
        emissive: colors.scooter.lampGlow,
        emissiveIntensity: 1.6,
        roughness: original.roughness,
        metalness: original.metalness,
      });
    default:
      return new THREE.MeshPhysicalMaterial({
        name,
        color: original.color,
        roughness: original.roughness,
        metalness: original.metalness,
      });
  }
}

/** Connected pieces of a non-indexed geometry (vertices welded by position). */
function components(geo) {
  const pos = geo.getAttribute('position');
  const triCount = pos.count / 3;
  const keyId = new Map();
  const ids = new Int32Array(pos.count);
  for (let i = 0; i < pos.count; i += 1) {
    const k = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (!keyId.has(k)) keyId.set(k, keyId.size);
    ids[i] = keyId.get(k);
  }
  const parent = Int32Array.from({ length: keyId.size }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (let t = 0; t < triCount; t += 1) {
    const a = find(ids[t * 3]);
    parent[find(ids[t * 3 + 1])] = a;
    parent[find(ids[t * 3 + 2])] = a;
  }
  const groups = new Map();
  for (let t = 0; t < triCount; t += 1) {
    const r = find(ids[t * 3]);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(t);
  }
  return [...groups.values()];
}

function centroidOf(pos, tris) {
  const c = new THREE.Vector3();
  tris.forEach((t) => {
    for (let k = 0; k < 3; k += 1) c.add(new THREE.Vector3().fromBufferAttribute(pos, t * 3 + k));
  });
  return c.divideScalar(tris.length * 3);
}

function subGeometry(geo, tris) {
  const pos = geo.getAttribute('position');
  const nor = geo.getAttribute('normal');
  const p = new Float32Array(tris.length * 9);
  const n = new Float32Array(tris.length * 9);
  tris.forEach((t, i) => {
    for (let k = 0; k < 3; k += 1) {
      const s = t * 3 + k;
      const d = (i * 3 + k) * 3;
      p[d] = pos.getX(s);
      p[d + 1] = pos.getY(s);
      p[d + 2] = pos.getZ(s);
      n[d] = nor.getX(s);
      n[d + 1] = nor.getY(s);
      n[d + 2] = nor.getZ(s);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}

const WHEEL_Z = { front: 1.12, rear: -1.88 };
const WHEEL_Y = -0.51;

/** Assign a connected piece (by material + centroid) to a named component. */
function classify(mat, c, triCount) {
  const nearWheel = (z) => Math.hypot(c.y - WHEEL_Y, c.z - z) < 0.75;
  if (c.y < -0.15 && nearWheel(WHEEL_Z.front)) return 'wheel_front';
  if (c.y < -0.15 && nearWheel(WHEEL_Z.rear)) return 'wheel_rear';
  if (mat === 'Material.002' && c.y > 0.4) return 'seat';
  if (c.y > 1.75) return c.x < 0 ? 'mirror_left' : 'mirror_right';
  if (c.y > 1.2) return 'handlebar';
  if (mat === 'Material.003' && Math.abs(c.x) > 0.3) return c.x < 0 ? 'trim_left' : 'trim_right';
  if (triCount < 40 && c.z < -1.2) return 'tail';
  if (mat === 'Material.001' && triCount > 200) return 'body';
  return c.z > 0 ? 'body_front' : 'tail';
}

/**
 * Dismantle choreography in model units: where each component flies and in
 * what order (0 = first). -x is the side facing the camera in the intro.
 */
export const PART_MOTION = {
  mirror_left: { offset: [-0.9, 1.0, 0.1], rot: [0.6, 0, 0.5], order: 0 },
  mirror_right: { offset: [0.9, 1.0, 0.1], rot: [-0.6, 0, 0.5], order: 0.04 },
  handlebar: { offset: [0, 1.15, 0.45], rot: [0.5, 0.3, 0], order: 0.12 },
  seat: { offset: [-0.2, 1.25, -0.2], rot: [0, 0, 0.35], order: 0.22 },
  trim_left: { offset: [-1.3, -0.25, 0.2], rot: [0, 0, -0.5], order: 0.3 },
  trim_right: { offset: [1.3, -0.25, 0.2], rot: [0, 0, 0.5], order: 0.32 },
  body_left: { offset: [-1.5, 0.35, -0.3], rot: [0, -0.35, -0.3], order: 0.42 },
  body_right: { offset: [1.5, 0.35, -0.3], rot: [0, 0.35, 0.3], order: 0.46 },
  body_front: { offset: [-0.2, 0.45, 1.45], rot: [-0.35, 0, 0.2], order: 0.54 },
  tail: { offset: [0, 0.4, -1.5], rot: [0.4, 0, 0], order: 0.6 },
  wheel_front: { offset: [-0.9, -0.15, 1.6], rot: [0, 0.6, 0], order: 0.8 },
  wheel_rear: { offset: [-0.9, -0.15, -1.6], rot: [0, -0.6, 0], order: 0.88 },
};

/**
 * Build a ready-to-use scooter from the loaded glTF scene.
 * Returns { root, parts, wheels } where root is placed so the tyres touch
 * y = 0 and the scooter is centred; each part is a Group pivoting at its
 * centre; wheels spin about their axle (model x axis).
 */
export function buildVespa(gltfScene) {
  const source = gltfScene.clone(true);
  source.updateMatrixWorld(true);
  const buckets = new Map(); // part -> [{ geo, material }]
  const add = (part, geo, material) => {
    if (!buckets.has(part)) buckets.set(part, []);
    buckets.get(part).push({ geo, material });
  };
  const disposables = [];

  source.traverse((node) => {
    if (!node.isMesh) return;
    const material = makeMaterial(node.material.name, node.material);
    disposables.push(material);
    let geo = node.geometry.clone().applyMatrix4(node.matrixWorld);
    geo = toCreasedNormals(geo, Math.PI / 5);
    const pos = geo.getAttribute('position');
    for (const tris of components(geo)) {
      const c = centroidOf(pos, tris);
      let part = classify(material.name, c, tris.length);
      if (part === 'body') {
        // cut the single body shell into separable panels
        const front = [];
        const left = [];
        const right = [];
        tris.forEach((t) => {
          const tc = centroidOf(pos, [t]);
          if (tc.z > 0.35) front.push(t);
          else if (tc.x < 0) left.push(t);
          else right.push(t);
        });
        if (front.length) add('body_front', subGeometry(geo, front), material);
        if (left.length) add('body_left', subGeometry(geo, left), material);
        if (right.length) add('body_right', subGeometry(geo, right), material);
        continue;
      }
      add(part, subGeometry(geo, tris), material);
    }
    geo.dispose();
  });

  const root = new THREE.Group();
  root.name = 'Vespa';
  const model = new THREE.Group();
  model.position.copy(MODEL_OFFSET);
  root.add(model);

  const parts = [];
  const spokeMat = new THREE.MeshStandardMaterial({ color: colors.scooter.spoke, roughness: 0.5, metalness: 0.4 });
  disposables.push(spokeMat);

  for (const [name, list] of buckets) {
    const box = new THREE.Box3();
    list.forEach(({ geo }) => {
      geo.computeBoundingBox();
      box.union(geo.boundingBox);
    });
    const isWheel = name.startsWith('wheel');
    const center = box.getCenter(new THREE.Vector3());
    if (isWheel) center.set(0, WHEEL_Y, center.z); // axle centre
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.copy(center);
    const holder = isWheel ? new THREE.Group() : pivot;
    if (isWheel) pivot.add(holder);
    list.forEach(({ geo, material }) => {
      geo.translate(-center.x, -center.y, -center.z);
      holder.add(new THREE.Mesh(geo, material));
    });
    const part = {
      name,
      object: pivot,
      ...(PART_MOTION[name] || { offset: [0, 0.6, 0], rot: [0, 0, 0], order: 0.5 }),
    };
    if (isWheel) {
      // spokes make the rotation readable
      const half = Math.max(Math.abs(box.min.x), Math.abs(box.max.x)) * 0.55;
      const radius = (box.max.y - box.min.y) / 2;
      for (const s of [-1, 1]) {
        for (let i = 0; i < 3; i += 1) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.02, radius * 1.45, 0.08), spokeMat);
          bar.position.x = s * (half + 0.006);
          bar.rotation.x = (i * Math.PI) / 3;
          holder.add(bar);
        }
      }
      part.spinner = holder;
      part.radius = radius;
    }
    part.offset = new THREE.Vector3(...part.offset);
    part.rot = new THREE.Vector3(...part.rot);
    part.basePosition = pivot.position.clone();
    part.baseRotation = pivot.rotation.clone();
    model.add(pivot);
    parts.push(part);
  }
  parts.sort((a, b) => a.order - b.order);

  return {
    root,
    parts,
    wheels: parts.filter((p) => p.spinner),
    dispose() {
      root.traverse((n) => n.geometry?.dispose());
      disposables.forEach((m) => m.dispose());
    },
  };
}
