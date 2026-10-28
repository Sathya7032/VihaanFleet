/**
 * Hero -> Services transition, anchored to the "Earn on" label in the logo
 * strip under the hero:
 *
 *  1. toEarn: as the strip scrolls up, the scooter drives left into the
 *     "Earn on" label and tucks behind it (the label is opaque).
 *  2. jump:   it leaps up out of the label on an arc - nose up, one stunt
 *     spin in mid-air - and lands in the Services position.
 *
 * Scroll-scrubbed both ways, so scrolling up plays it in reverse.
 */
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const MODEL_ASPECT = 3.2 / 4.38; // scooter height / length on screen (side view)

// Band-top positions (share of viewport height) that drive the two phases.
const TO_EARN_FROM = 1.0; // strip top enters at the bottom of the screen
const TO_EARN_TO = 0.62; // ... scooter is tucked in the label
const JUMP_TO = 0.06; // ... scooter has landed in the Services position

/** Reads the strip; returns null if it isn't on the page. */
export function readEarnJump(width, height) {
  const band = document.querySelector('.marquee');
  const label = band?.querySelector('.marquee-label');
  if (!band || !label) return null;
  const b = band.getBoundingClientRect();
  const l = label.getBoundingClientRect();
  const vh = height;

  // a scooter small enough to hide completely behind the label
  const lenPx = Math.min(l.width * 0.72, (l.height * 0.84) / MODEL_ASPECT);
  const hPx = lenPx * MODEL_ASPECT;
  const groundY = l.bottom - (l.height - hPx) / 2;
  const earnPose = {
    nx: ((l.left + l.width / 2) / width) * 2 - 1,
    ny: 1 - (2 * groundY) / vh,
    size: lenPx / width,
    rotY: -Math.PI / 2, // facing left, as it drives in
  };

  return {
    earnPose,
    toEarn: clamp01((TO_EARN_FROM * vh - b.top) / ((TO_EARN_FROM - TO_EARN_TO) * vh)),
    jump: clamp01((TO_EARN_TO * vh - b.top) / ((TO_EARN_TO - JUMP_TO) * vh)),
  };
}

/**
 * Pose while driving into the label: travel left first (fast), then drop in
 * (late), so the scooter goes into the label rather than under the logos.
 */
export function toEarnPose(out, from, to, t) {
  const q = clamp01(t);
  const ex = 1 - Math.pow(1 - Math.min(1, q / 0.7), 3); // x done by 70%
  const ey = q * q * q; // drop at the end
  out.nx = from.nx + (to.nx - from.nx) * ex;
  out.ny = from.ny + (to.ny - from.ny) * ey;
  out.size = from.size + (to.size - from.size) * (q * q);
  out.rotY = from.rotY + (to.rotY - from.rotY) * q;
  out.spin = 0;
  out.air = 0;
  return out;
}

/** Pose along the jump arc from the label to `to` (Services). */
export function jumpPose(out, from, to, t) {
  const e = easeInOut(clamp01(t));
  // quadratic arc: control point lifted well above both ends
  const cx = (from.nx + to.nx) / 2;
  const cy = Math.max(from.ny, to.ny) + 0.55;
  const a = (1 - e) * (1 - e);
  const b = 2 * (1 - e) * e;
  const c = e * e;
  out.nx = a * from.nx + b * cx + c * to.nx;
  out.ny = a * from.ny + b * cy + c * to.ny;
  // grows as it leaves the label
  out.size = from.size + (to.size - from.size) * Math.min(1, e * 1.25);
  out.rotY = from.rotY + (to.rotY - from.rotY) * e;
  // one full stunt spin and a nose-up wheelie while airborne (not smoothed)
  out.spin = e > 0 && e < 1 ? 2 * Math.PI * easeInOut(clamp01((e - 0.1) / 0.75)) : 0;
  out.air = Math.sin(Math.PI * e) * 0.38;
  return out;
}
