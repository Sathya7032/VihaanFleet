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
 *  circles:  step-number centres (and radius r) in viewport px
 *  lineTop:  top edge of the route line in viewport px (null where it is hidden)
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
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.height / 2 };
  });
  const line = track.querySelector('.route-line')?.getBoundingClientRect();
  return { approach, p, circles, lineTop: line && line.height > 0 ? line.top : null };
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

// The 3D scooter is drawn behind the page, so wherever it overlaps the route
// line or a step number the page paints over it. The line runs above the
// numbers, so riding just on top of the line keeps it clear of both.
const GAP = 6; // px of air under the tyres (covers idle float and pitch)

/**
 * Screen y the tyres rest on at x (CSS px), for a scooter halfLen px long each
 * way: just above the route line, flat all the way along. Without a visible
 * line (mobile) it rides at step-number-top height along the route point's y.
 * Returns Infinity where nothing is underneath.
 */
export function groundAt(route, x, halfLen, routeY = null) {
  const { circles, lineTop } = route;
  if (lineTop == null) return routeY == null ? Infinity : routeY - (circles[0]?.r || 0) - GAP;
  const first = circles[0];
  const last = circles[circles.length - 1];
  const left = Math.min(first.x, last.x) - first.r - halfLen;
  const right = Math.max(first.x, last.x) + first.r + halfLen;
  return x < left || x > right ? Infinity : lineTop - GAP;
}
