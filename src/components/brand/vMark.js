import colors from '../../utils/colors';

/**
 * The Vihaan Fleet "V" monogram, defined once and used by:
 *  - the navbar / footer logo (BrandMark.jsx, as SVG)
 *  - the intro, where particles assemble into exactly this shape
 *  - the favicon (generated at runtime)
 *
 * Coordinates are in a 40 x 40 tile.
 */
export const V_TILE = 40;
export const V_POLYGON = [
  [8.6, 10.4],
  [15.1, 10.4],
  [20, 24.4],
  [24.9, 10.4],
  [31.4, 10.4],
  [23.1, 30.2],
  [16.9, 30.2],
];

export const vPath = `M${V_POLYGON.map((p) => p.join(' ')).join(' L')} Z`;

/** Point-in-polygon test in tile coordinates. */
export function insideV(x, y) {
  let inside = false;
  for (let i = 0, j = V_POLYGON.length - 1; i < V_POLYGON.length; j = i, i += 1) {
    const [xi, yi] = V_POLYGON[i];
    const [xj, yj] = V_POLYGON[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** `count` random points inside the V, in tile coordinates (0..40). */
export function sampleV(count, rand = Math.random) {
  const pts = new Float32Array(count * 2);
  let n = 0;
  while (n < count) {
    const x = 8 + rand() * 24;
    const y = 10 + rand() * 20.5;
    if (insideV(x, y)) {
      pts[n * 2] = x;
      pts[n * 2 + 1] = y;
      n += 1;
    }
  }
  return pts;
}

/** Favicon: gold V on the dark tile. */
export function vFaviconDataUri() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${colors.gold.light}'/><stop offset='.55' stop-color='${colors.gold.base}'/><stop offset='1' stop-color='${colors.gold.deep}'/></linearGradient></defs><rect width='40' height='40' rx='10' fill='${colors.theme.surface}'/><path d='${vPath}' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
