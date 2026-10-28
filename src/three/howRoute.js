/**
 * "How it works" route: the section pins while you scroll, and the scroll
 * progress through the pin drives the background scooter along the four step
 * circles (1 -> 4). Shared by the 3D stage and the DOM effects (gold route
 * fill + lit step numbers) so they stay in sync.
 */
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Small dwell at each step number while still passing through it. */
const DWELL = 0.35;
const dwell = (u) => u - (DWELL * Math.sin(2 * Math.PI * u)) / (2 * Math.PI);

/**
 * Reads the pinned section. Returns null when the section isn't on the page.
 *  approach: 0..1 while the section scrolls up into its pinned position
 *  p:        0..1 through the pinned scroll (step 1 at 0, step 4 at 1)
 *  circles:  step-number centres in viewport px
 */
export function readHowRoute() {
  const track = document.getElementById('how');
  const pin = track?.querySelector('.how-pin');
  if (!track || !pin) return null;
  const vh = window.innerHeight;
  const tr = track.getBoundingClientRect();
  const pinTop = Math.min(0, vh - pin.offsetHeight); // tall content pins by its bottom edge
  const travel = Math.max(1, tr.height - pin.offsetHeight);
  const startLine = vh * 0.95;
  const approach = clamp01((startLine - tr.top) / Math.max(1, startLine - pinTop));
  const p = clamp01((pinTop - tr.top) / travel);
  const circles = [...track.querySelectorAll('.step-n')].map((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  return { approach, p, circles };
}

/**
 * Point on the step polyline at progress p (each step-to-step leg takes an
 * equal share, so step i is reached exactly at p = i / (n - 1)).
 * Returns { x, y, dir } with dir = +1 moving right, -1 moving left.
 */
export function pointOnRoute(circles, p) {
  const n = circles.length;
  if (n === 0) return null;
  if (n === 1) return { ...circles[0], dir: 1 };
  const legs = n - 1;
  const f = clamp01(p) * legs;
  const i = Math.min(legs - 1, Math.floor(f));
  const u = dwell(f - i);
  const a = circles[i];
  const b = circles[i + 1];
  const dx = b.x - a.x;
  return { x: a.x + dx * u, y: a.y + (b.y - a.y) * u, dir: dx >= 0 ? 1 : -1 };
}

/** Index of the last step the scooter has reached at progress p. */
export function reachedStep(circles, p) {
  const legs = Math.max(1, circles.length - 1);
  return Math.floor(clamp01(p) * legs + 0.02);
}
