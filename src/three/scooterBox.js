/**
 * The background scooter's size and on-screen footprint. Kept free of
 * three.js so DOM code in the main bundle can line things up with it.
 */
export const MODEL_LENGTH = 4.38;
export const MODEL_HEIGHT = 3.2;
export const MAX_HEIGHT_SHARE = 0.34; // scooter never taller than this share of the viewport

/** Screen box (CSS px) of the scooter for a pose; ny is where the tyres touch the ground. */
export function scooterBox({ nx, ny, size }, width, height) {
  const h = Math.min((size * width * MODEL_HEIGHT) / MODEL_LENGTH, MAX_HEIGHT_SHARE * height);
  const w = (h * MODEL_LENGTH) / MODEL_HEIGHT;
  const bottom = ((1 - ny) / 2) * height;
  return { left: ((nx + 1) / 2) * width - w / 2, top: bottom - h, width: w, height: h };
}
