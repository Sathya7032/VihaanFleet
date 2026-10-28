import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import BrandMark from '../brand/BrandMark';
import { EXIT_FADE_MS, LOAD_TIMEOUT_MS, LOGO_HERO_SCALE, TIMELINE } from './introConfig';
import { markIntroPlayed } from './introEnvironment';
import './intro.css';

// three.js lives in its own chunk, loaded in parallel with the homepage.
const ScooterScene = lazy(() => import('./ScooterScene'));

/** If WebGL or the 3D chunk fails, skip straight to the homepage. */
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn('[VihaanIntro] 3D scene failed, skipping intro.', error);
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const isMobileDevice = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 767px), (pointer: coarse)').matches;

// the WebGL loop stops once the particles have faded (before the logo flies)
const SCENE_STAGES = new Set(['loading', 'drive', 'dismantle', 'mark', 'word']);
const BLOCKING_STAGES = new Set(['loading', 'drive', 'dismantle', 'mark', 'word']);

/**
 * Full-screen intro, one explicit state machine driven by the shared TIMELINE:
 *
 *   loading -> drive -> dismantle -> mark -> word -> move -> fade -> (unmount)
 *
 *  drive      the scooter rides in a straight line from the left-centre to the centre
 *  dismantle  its components separate and stream into a gold particle "V"
 *  mark       the real V monogram (BrandMark) solidifies over the particle V
 *  word       "Vihaan Fleet" writes on beside it; the lock-up re-centres
 *  move       FLIP: the whole lock-up travels + scales into the navbar logo slot
 *  fade       backdrop fades, homepage revealed under the landing logo
 *  hand-off   navbar logo shown + overlay logo removed in the same React commit
 */
export default function IntroAnimation({ targetRef, onHandoff, onComplete }) {
  const [isMobile] = useState(isMobileDevice);
  const [stage, setStage] = useState('loading');
  const [landed, setLanded] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const startRef = useRef(null);
  const logoRef = useRef(null);
  const roadRef = useRef(null);
  const vRectRef = useRef(null); // where the V sits on screen (particles target it)
  const reportRef = useRef(null); // from the 3D engine: ground line y
  const phaseRef = useRef('v'); // logo layout: 'v' (V centred) | 'center' (lock-up centred) | 'nav'
  const finishedRef = useRef(false);
  const handedOffRef = useRef(false);
  const callbacks = useRef({ onHandoff, onComplete });

  useEffect(() => {
    callbacks.current = { onHandoff, onComplete };
  });

  const handoff = useCallback(() => {
    if (handedOffRef.current) return;
    handedOffRef.current = true;
    markIntroPlayed();
    setLanded(true); // same batch as the parent's logo state -> one commit, no flicker
    callbacks.current.onHandoff?.();
  }, []);

  /**
   * Lay out the overlay lock-up for the current phase. All measurements are
   * read before any style is written (a read between writes would force a
   * style recalc and make part of a transition jump).
   */
  const layoutLogo = useCallback(
    (animateMs = 0) => {
      const el = logoRef.current;
      if (!el) return;
      const mark = el.querySelector('.brand-mark');
      const w = el.offsetWidth;
      const ix = mark.offsetLeft;
      const iy = mark.offsetTop;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const target = phaseRef.current === 'nav' ? targetRef?.current?.getBoundingClientRect() : null;

      let x;
      let y;
      let s;
      if (phaseRef.current === 'nav') {
        if (!target) return;
        // very narrow phones show only the V in the navbar: let the word fade out on the way
        const navWord = targetRef.current.parentElement?.querySelector('.brand-word');
        el.dataset.word = navWord && getComputedStyle(navWord).display === 'none' ? 'fade' : 'keep';
        x = target.left - ix;
        y = target.top - iy;
        s = 1;
      } else {
        s = Math.min(isMobile ? LOGO_HERO_SCALE.mobile : LOGO_HERO_SCALE.desktop, (vw * 0.86) / Math.max(w, 1));
        const cx = vw / 2;
        const cy = vh / 2;
        y = cy - (iy + 20) * s;
        x = phaseRef.current === 'v' ? cx - (ix + 20) * s : cx - (w * s) / 2;

      }
      el.style.transition = animateMs
        ? `transform ${animateMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
        : 'none';
      el.style.setProperty('--vf-x', `${x}px`);
      el.style.setProperty('--vf-y', `${y}px`);
      el.style.setProperty('--vf-s', `${s}`);
      if (phaseRef.current === 'v') {
        // measure the real on-screen V (no transition in this phase): the
        // particles assemble exactly over it
        const r = el.querySelector('.vmark').getBoundingClientRect();
        vRectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
      }
    },
    [isMobile, targetRef]
  );

  const placeRoad = useCallback(() => {
    const r = reportRef.current;
    if (roadRef.current && r) roadRef.current.style.top = `${r.groundY}px`;
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    handoff();
    setStage('exit');
  }, [handoff]);

  // Initial layout (hidden, V centred) so the particle targets are known early.
  useEffect(() => {
    layoutLogo(0);
    const onResize = () => {
      layoutLogo(0);
      placeRoad();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [layoutLogo, placeRoad]);

  // First 3D frame rendered: start the shared clock.
  const handleReady = useCallback(() => {
    if (finishedRef.current || startRef.current != null) return;
    const now = performance.now();
    startRef.current = now;
    placeRoad();
    setStartTime(now);
    setStage('drive');
  }, [placeRoad]);

  // Stage timers, all relative to the shared start time.
  useEffect(() => {
    if (startTime == null) return undefined;
    const ms = (sec) => Math.round(sec * 1000);
    const plan = [
      [
        TIMELINE.dismantleStart - 0.2,
        () => layoutLogo(0), // re-measure the V target (fonts are surely loaded by now)
      ],
      [TIMELINE.dismantleStart, () => setStage('dismantle')],
      [TIMELINE.markIn, () => setStage('mark')],
      [
        TIMELINE.wordStart,
        () => {
          phaseRef.current = 'center';
          layoutLogo(ms(TIMELINE.wordEnd - TIMELINE.wordStart));
          setStage('word');
        },
      ],
      [
        TIMELINE.moveStart,
        () => {
          phaseRef.current = 'nav';
          layoutLogo(ms(TIMELINE.moveEnd - TIMELINE.moveStart));
          setStage('move');
        },
      ],
      [TIMELINE.fadeStart, () => setStage('fade')],
      [TIMELINE.moveEnd + 0.04, handoff], // +40 ms: let the move's last frame paint
      [
        TIMELINE.end,
        () => {
          finishedRef.current = true;
          callbacks.current.onComplete?.();
        },
      ],
    ];
    const timers = plan.map(([at, fn]) =>
      window.setTimeout(() => {
        if (!finishedRef.current) fn();
      }, Math.max(0, at * 1000 - (performance.now() - startTime)))
    );
    return () => timers.forEach(window.clearTimeout);
  }, [startTime, layoutLogo, handoff]);

  // Never hold the homepage hostage to a slow network or weak GPU.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (startRef.current == null) finish();
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [finish]);

  // Skip on Escape, when the tab is hidden, or if reduced motion is switched on.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && finish();
    const onVisibility = () => document.hidden && finish();
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotion = () => mql.matches && finish();
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
    mql?.addEventListener('change', onMotion);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      mql?.removeEventListener('change', onMotion);
    };
  }, [finish]);

  // Skipped: fade the overlay, then hand control back.
  useEffect(() => {
    if (stage !== 'exit') return undefined;
    const id = window.setTimeout(() => callbacks.current.onComplete?.(), EXIT_FADE_MS);
    return () => window.clearTimeout(id);
  }, [stage]);

  return (
    <div
      className="vf-intro"
      data-stage={stage}
      style={{
        '--vf-exit-ms': `${EXIT_FADE_MS}ms`,
        '--vf-word-ms': `${Math.round((TIMELINE.wordEnd - TIMELINE.wordStart) * 1000)}ms`,
        pointerEvents: BLOCKING_STAGES.has(stage) ? 'auto' : 'none',
      }}
    >
      <div className="vf-intro__backdrop" aria-hidden="true" />
      <div ref={roadRef} className="vf-intro__road" aria-hidden="true" />

      <div className="vf-intro__scene" aria-hidden="true">
        <SceneBoundary onError={finish}>
          <Suspense fallback={null}>
            <ScooterScene
              startTime={startTime}
              isMobile={isMobile}
              vRectRef={vRectRef}
              reportRef={reportRef}
              onReady={handleReady}
              onError={finish}
              active={SCENE_STAGES.has(stage)}
            />
          </Suspense>
        </SceneBoundary>
      </div>

      {!landed && (
        // The same BrandMark the navbar renders: at scale 1 it is pixel-identical.
        <div ref={logoRef} className="vf-intro__logo" aria-hidden="true">
          {/* .brand applies the navbar's responsive lock-up sizes */}
          <span className="brand">
            <BrandMark />
          </span>
        </div>
      )}

      {BLOCKING_STAGES.has(stage) && (
        <button type="button" className="vf-intro__skip" onClick={finish} aria-label="Skip intro animation">
          Skip intro
        </button>
      )}
    </div>
  );
}
