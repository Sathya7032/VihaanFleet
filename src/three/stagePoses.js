
/**
 * Where the background scooter sits for each homepage section (ported from
 * the reference site). nx/ny are -1..1 across the viewport, size is the
 * scooter's share of the viewport width, rotY its heading
 * (-PI/2 = facing left, +PI/2 = facing right).
 */
import { scooterBox } from './scooterBox';

const LEFT = -Math.PI / 2;
const RIGHT = Math.PI / 2;

export const RIDE_IN_FROM_NX = 1.7; // hero ride-in starts off-screen right
export const RIDE_IN_SECONDS = 3;
export const RIDE_IN_HIT_AT = 2.0; // suspension "landing" bump
export const EXIT_NX = -1.7;

/** Scooter size while it rides the "How it works" route (share of viewport width). */
export const HOW_SIZE = { desktop: 0.08, mobile: 0.2 };
export const HEADING = { left: LEFT, right: RIGHT };

const DESKTOP = {
  hero: { nx: 0, ny: -0.8, size: 0.21, rotY: LEFT }, // a little smaller than the other sections
  services: { nx: 0.66, ny: -0.3, size: 0.36, rotY: LEFT + 0.22 }, // nx is fitted to the viewport in posesFor()
  pricing: { nx: -0.55, ny: -0.22, size: 0.4, rotY: RIGHT - 0.22 },
  howStart: { nx: -0.82, ny: -0.8, size: 0.17, rotY: RIGHT },
  howEnd: { nx: 0.82, ny: -0.8, size: 0.17, rotY: RIGHT },
  app: { nx: -0.62, ny: -0.74, size: 0.2, rotY: LEFT },
  cta: { nx: 0, ny: -0.84, size: 0.24, rotY: LEFT },
  exit: { nx: EXIT_NX, ny: -0.84, size: 0.24, rotY: LEFT },
};

export const POSES = {
  desktop: DESKTOP,
  mobile: {
    hero: { nx: 0, ny: -0.84, size: 0.44, rotY: LEFT },
    services: { nx: 0.1, ny: -0.88, size: 0.46, rotY: LEFT + 0.5 },
    pricing: { nx: -0.1, ny: -0.62, size: 0.4, rotY: RIGHT - 0.5 }, // raised: the stats sit under it
    howStart: { nx: -0.7, ny: -0.82, size: 0.3, rotY: RIGHT },
    howEnd: { nx: 0.7, ny: -0.82, size: 0.3, rotY: RIGHT },
    app: { nx: -0.3, ny: -0.82, size: 0.4, rotY: LEFT },
    cta: { nx: 0, ny: -0.84, size: 0.5, rotY: LEFT },
    exit: { nx: EXIT_NX, ny: -0.84, size: 0.5, rotY: LEFT },
  },
};

const SERVICES_EDGE = 20; // px between the Services scooter and the right edge of the screen

/** Pose set for the viewport (CSS px); on desktop the Services scooter is pinned to the right edge. */
export function posesFor(w, h) {
  if (w <= 860) return POSES.mobile;
  const s = DESKTOP.services;
  const nx = 1 - (scooterBox(s, w, h).width + 2 * SERVICES_EDGE) / w;
  return { ...DESKTOP, services: { ...s, nx } };
}

/**
 * Scroll segments: [trigger, from, to, start, end]. start/end are
 * "<edge> <viewport %>" like ScrollTrigger: the segment runs while the
 * trigger's edge moves from the first viewport position to the second.
 */
export const SEGMENTS = [
  // Hero -> Services: starts with the first scroll on the hero and lands as
  // the "What we do" section pins (it glides under the glass logo strip).
  ['#services', 'hero', 'services', 'custom:fromHero'],
  ['#pricing', 'services', 'pricing', 'top 95', 'top 35'],
  // "How it works" is pinned: the scooter drives onto step 1, then rides the
  // route through steps 1 -> 4 with scroll (see howRoute.js), parks on step 4.
  ['#how', 'pricing', 'howStart', 'custom:approach'],
  ['#how', 'howStart', 'howEnd', 'custom:route'],
  // No journey below "How it works": the scooter stays parked on step 4 and
  // scrolls away with that section.
];

const KEYS = ['nx', 'ny', 'size', 'rotY'];
const SERVICES_TURN = 0.45; // how far the scooter turns each way during the pinned "What we do" steps
// Turning shortens the scooter on screen; this nudge (per unit of size) keeps its tail near the edge.
export const SERVICES_TURN_SHIFT = 0.2;

/** 0..1 through the pinned "What we do" section. */
function servicesProgress(vh) {
  const el = document.getElementById('services');
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  const span = r.height - vh;
  return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function lerpPose(out, a, b, t) {
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

/**
 * Target pose for the current scroll position.
 * `how` (optional) carries the live "How it works" route: approach / p
 * progress and the step-1, current and step-4 poses measured from the DOM.
 */
export function poseForScroll(out, poses, heroPose, vh, how) {
  lerpPose(out, heroPose, heroPose, 0);
  out.spin = 0;
  out.air = 0;
  for (const [sel, from, to, start, end] of SEGMENTS) {
    if (start === 'custom:fromHero') {
      const el = document.querySelector(sel);
      if (!el) continue;
      const land = el.getBoundingClientRect().top + window.scrollY;
      const p = land > 0 ? Math.min(1, Math.max(0, window.scrollY / land)) : 1;
      if (p > 0) {
        lerpPose(out, heroPose, poses.services, ease(p));
        // turns one way then the other while the steps play, back to rest at both ends
        const turn = Math.sin(servicesProgress(vh) * Math.PI * 2);
        out.rotY += turn * SERVICES_TURN * p;
        out.nx += Math.abs(turn) * SERVICES_TURN_SHIFT * poses.services.size * p;
      }
      continue;
    }
    if (start === 'custom:approach') {
      if (how && how.approach > 0) lerpPose(out, poses[from], how.startPose, how.approach);
      continue;
    }
    if (start === 'custom:route') {
      if (how && how.p > 0) lerpPose(out, how.routePose, how.routePose, 0);
      continue;
    }
    const el = document.querySelector(sel);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const edge = (spec) => {
      const [which, pct] = spec.split(' ');
      return { y: which === 'top' ? r.top : r.bottom, at: (Number(pct) / 100) * vh };
    };
    const s = edge(start);
    const e = edge(end);
    // progress 0 when edge is at s.at, 1 when (the same or other) edge is at e.at
    const p0 = s.at - s.y; // how far past the start line
    const span = s.at - e.at + (e.y - s.y);
    const p = span <= 0 ? (p0 >= 0 ? 1 : 0) : Math.min(1, Math.max(0, p0 / span));
    const fromPose = from === 'hero' ? heroPose : from === 'howEnd' && how ? how.endPose : poses[from];
    if (p > 0) lerpPose(out, fromPose, poses[to], p);
  }
  return out;
}
