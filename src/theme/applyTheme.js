import colors from '../utils/colors';
import { vFaviconDataUri } from '../components/brand/vMark';

/**
 * Exposes the palette from utils/colors.js as CSS custom properties on
 * <html>, so every stylesheet reads brand colours from that one file.
 * Runs before React renders, so the first paint is already themed.
 */
export const themeVars = {
  '--bg': colors.theme.bg,
  '--bg-deep': colors.theme.bgDeep,
  '--ink': colors.theme.ink,
  '--muted': colors.theme.muted,
  '--faint': colors.theme.faint,
  '--line': colors.theme.line,
  '--glass': colors.theme.glass,
  '--surface': colors.theme.surface,
  '--surface-raised': colors.theme.surfaceRaised,
  '--phone-border': colors.theme.phoneBorder,
  '--on-gold': colors.theme.onGold,
  '--success': colors.theme.success,
  '--toggle': colors.theme.toggle,
  '--gold-1': colors.gold.light,
  '--gold-2': colors.gold.base,
  '--gold-3': colors.gold.deep,
  '--gold-grad': `linear-gradient(120deg, ${colors.gold.light}, ${colors.gold.base} 55%, ${colors.gold.deep})`,
};

export function applyTheme(root = document.documentElement) {
  Object.entries(themeVars).forEach(([k, v]) => root.style.setProperty(k, v));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', colors.theme.bg);
  const icon = document.getElementById('favicon');
  if (icon) icon.setAttribute('href', vFaviconDataUri());
}
