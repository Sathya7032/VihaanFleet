import { PLAY_ONCE_PER_SESSION, SESSION_KEY } from './introConfig';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function matches(query) {
  return typeof window !== 'undefined' && !!window.matchMedia?.(query).matches;
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Decide once, synchronously on first render, whether the intro should play.
 * Doing this before paint means the navbar logo starts hidden only when the
 * intro will actually run - no flash and no layout shift.
 */
export function shouldPlayIntro() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('nointro')) return false;
  if (params.has('intro')) return supportsWebGL();
  if (matches(REDUCED_QUERY)) return false;
  try {
    if (PLAY_ONCE_PER_SESSION && window.sessionStorage.getItem(SESSION_KEY)) return false;
  } catch {
    /* storage blocked: just play it */
  }
  return supportsWebGL();
}

export function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}
