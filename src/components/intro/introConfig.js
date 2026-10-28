/**
 * Intro timeline (seconds from the first rendered 3D frame). The React stage
 * machine (IntroAnimation) and the WebGL engine (introEngine) both read this
 * one table, so the DOM logo and the 3D scene never drift apart.
 *
 * drive -> dismantle -> form V -> V mark -> wordmark -> move to navbar
 */
export const TIMELINE = {
  driveEnd: 1.5, // scooter rides in from the left-centre, brakes to a stop at the centre
  dismantleStart: 1.85, // components start separating
  dismantleEnd: 3.0, // last component has dissolved into particles
  vFormed: 3.4, // every particle has reached its place in the V
  markIn: 3.4, // the solid V monogram fades in over the particle V
  markInEnd: 3.7,
  wordStart: 3.8, // "Vihaan Fleet" writes on, the lock-up re-centres
  wordEnd: 4.4,
  moveStart: 4.65, // V + wordmark travel and scale into the navbar
  moveEnd: 5.35,
  fadeStart: 5.0, // backdrop fades, homepage revealed under the landing logo
  end: 5.65, // overlay unmounted
};

/** Skip the intro if three.js + the model aren't ready by then. */
export const LOAD_TIMEOUT_MS = 3000;

/** Fade used when the intro is skipped. */
export const EXIT_FADE_MS = 320;

/** false = play on every page load. true = only once per browser tab session. */
export const PLAY_ONCE_PER_SESSION = false;
export const SESSION_KEY = 'vf-intro-played';

/** Particles that form the V. */
export const PARTICLES = {
  desktop: 2400,
  mobile: 1100,
};

/** Scooter size as a share of viewport width. */
export const SCOOTER_SIZE = {
  desktop: 0.34,
  mobile: 0.66,
};

/** Overlay logo scale while it is centre-stage (navbar size = 1). */
export const LOGO_HERO_SCALE = {
  desktop: 3.4,
  mobile: 2.2,
};
