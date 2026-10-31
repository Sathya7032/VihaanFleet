
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
  // "What we do": parked at the right edge (nx fitted in posesFor()); its tyre line is the baseline
  // the heading text and the step card end on
  services: { nx: 0.66, ny: -0.4, size: 0.26, rotY: LEFT + 0.22 },
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

// "What we do" on desktop: the scooter stays parked at the right edge; the step card sits on its
// left and the heading column fills the rest.
const SERVICES_EDGE = 20; // px from the screen's right edge to the scooter's box
const SERVICES_GAP = 48; // px between the heading column and the step card
const SERVICES_LINK = 44; // px connector between the card and the scooter (CSS --link)
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Desktop "What we do" layout in CSS px: where the scooter parks, and the heading column and card widths. */
export function servicesLayout(w, h) {
  const box = scooterBox(DESKTOP.services, w, h);
  const copyLeft = Math.max(clamp(0.05 * w, 20, 64), (w - 1200) / 2); // matches --gutter / --container
  const panelW = clamp(0.2 * w, 220, 300);
  const left = w - SERVICES_EDGE - box.width;
  const copyW = clamp(left - SERVICES_LINK - panelW - SERVICES_GAP - copyLeft, 260, 540);
  return { copyW, panelW, nx: ((left + box.width / 2) / w) * 2 - 1 };
}

/** Pose set for the viewport (CSS px). */
export function posesFor(w, h) {
  if (w <= 860) return POSES.mobile;
  return { ...DESKTOP, services: { ...DESKTOP.services, nx: servicesLayout(w, h).nx } };
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
  // lands as the pricing section pins (desktop pose measured from its layout: three/pricingLayout.js)
  ['#pricing', 'services', 'pricing', 'top 95', 'top 0'],
  // "How it works" is pinned: the scooter drives onto step 1, then rides the
  // route through steps 1 -> 4 with scroll (see howRoute.js), parks on step 4.
  ['#how', 'pricing', 'howStart', 'custom:approach'],
  ['#how', 'howStart', 'howEnd', 'custom:route'],
  // No journey below "How it works": the scooter stays parked on step 4 and
  // scrolls away with that section.
];

const KEYS = ['nx', 'ny', 'size', 'rotY'];

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
      if (p > 0) lerpPose(out, heroPose, poses.services, ease(p));
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
