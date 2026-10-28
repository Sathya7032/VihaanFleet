/**
 * Hero -> Services transition through the logo strip under the hero.
 *
 * The strip is opaque and sits above the scooter layer, so while it scrolls
 * up over the parked hero scooter, the scooter disappears under its top edge
 * and comes back out at its bottom line. Only once it is fully clear of the
 * strip does it move on to the Services pose (scroll-scrubbed both ways).
 */
import { MAX_HEIGHT_SHARE, MODEL_HEIGHT, MODEL_LENGTH } from './scooterBox';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const CLEAR_GAP = 8; // px between the strip's bottom line and the scooter before it moves
const END_AT = 0.12; // ... done when the strip's bottom line reaches 12% of the viewport

/** Progress 0..1 of the move to Services; null if the strip isn't on the page. */
export function readLogoPass(width, height, heroPose) {
  const band = document.querySelector('.marquee');
  if (!band) return null;
  const b = band.getBoundingClientRect();
  const scooterH = Math.min((heroPose.size * width * MODEL_HEIGHT) / MODEL_LENGTH, MAX_HEIGHT_SHARE * height);
  const groundY = ((1 - heroPose.ny) / 2) * height;
  const startY = groundY - scooterH - CLEAR_GAP; // strip bottom here = scooter fully out
  const endY = END_AT * height;
  if (startY <= endY) return { p: b.bottom < startY ? 1 : 0 };
  return { p: clamp01((startY - b.bottom) / (startY - endY)) };
}
