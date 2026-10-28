import { useCallback, useEffect, useRef, useState } from 'react';
import { TESTIMONIALS, TESTIMONIALS_ARE_SAMPLES } from '../../content/testimonials';

const AUTOPLAY_MS = 7000;
const SWIPE_PX = 80;

const initials = (name) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Resting pose of a card by its depth in the pack (0 = top). */
const PACK = [
  { x: 0, y: 0, r: 0 },
  { x: -14, y: 14, r: -4.5 },
  { x: 16, y: 26, r: 3.8 },
  { x: -8, y: 36, r: -2.4 },
  { x: 10, y: 44, r: 2 },
];
const packPose = (d) => {
  const p = PACK[Math.min(d, PACK.length - 1)];
  return {
    '--x': `${p.x}px`,
    '--y': `${p.y}px`,
    '--r': `${p.r}deg`,
    '--s': 1 - d * 0.045,
    '--o': d > 3 ? 0 : 1,
    zIndex: 40 - d,
  };
};

/** Quote split into words so they can rise in one by one; highlight in gold. */
function Quote({ text, highlight }) {
  const start = highlight ? text.indexOf(highlight) : -1;
  const end = start + (highlight?.length || 0);
  let pos = 0;
  return text.split(' ').map((w, i) => {
    const at = text.indexOf(w, pos);
    pos = at + w.length;
    const gold = start >= 0 && at >= start && at < end;
    return (
      <span key={i} className={`tx-w${gold ? ' gold-text' : ''}`} style={{ '--i': i }}>
        {w}{' '}
      </span>
    );
  });
}

/** Small side-view scooter that rides the story road (original drawing). */
function MiniScooter() {
  const wheel = (cx) => (
    <g className="tx-wheel" style={{ transformOrigin: `${cx}px 34px` }}>
      <circle cx={cx} cy="34" r="7" className="tx-tyre" />
      <circle cx={cx} cy="34" r="2.6" className="tx-hub" />
      <path d={`M${cx - 4.6} 34h9.2M${cx} 29.4v9.2`} className="tx-spoke" />
    </g>
  );
  return (
    <svg viewBox="0 0 72 44" aria-hidden="true">
      <path
        className="tx-sc-body"
        d="M4 31c0-9 7-14 17-14h10c3 0 4 2 4 5v5h10l5.5-17H55l-5.6 20.5C48.6 33.6 46 35 43 35H11c-4.5 0-7-1.5-7-4z"
      />
      <path className="tx-sc-fender" d="M45 34c1.6-7 15.4-7 17 0" />
      <path className="tx-sc-line" d="M47.5 6.5h11" />
      <circle className="tx-sc-lamp" cx="55.5" cy="11" r="2.2" />
      <rect className="tx-sc-seat" x="9" y="11.5" width="18" height="5" rx="2.5" />
      {wheel(15)}
      {wheel(55)}
    </svg>
  );
}

/**
 * "Rider stories": a pack of ride tickets. The top ticket is thrown off the
 * pack (or swiped away) and tucks in at the back; a little scooter rides the
 * road below from rider to rider as the autoplay timer. Pauses on hover,
 * focus or when off screen; no motion with reduced-motion.
 */
export default function TestimonialsSection() {
  const n = TESTIMONIALS.length;
  const [active, setActive] = useState(0);
  const [anim, setAnim] = useState(null); // { i, type: 'out' | 'in', dir, id }
  const [paused, setPaused] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const deckRef = useRef(null);
  const roadRef = useRef(null);
  const scooterRef = useRef(null);
  const live = useRef({ active: 0, paused: false, inView: false, elapsed: 0, x: null, drag: null });

  const go = useCallback(
    (to, dir = 1, user = false) => {
      const from = live.current.active;
      const next = ((to % n) + n) % n;
      if (next === from) return;
      live.current.active = next;
      live.current.elapsed = 0;
      setActive(next);
      if (!reduced) {
        setAnim(dir > 0 ? { i: from, type: 'out', dir: 1, id: Date.now() } : { i: next, type: 'in', dir: -1, id: Date.now() });
      }
      if (user) setAnnounce(`Story ${next + 1} of ${n}: ${TESTIMONIALS[next].name}`);
    },
    [n, reduced]
  );
  const throwTop = useCallback(
    (dir) => {
      const from = live.current.active;
      live.current.active = (from + 1) % n;
      live.current.elapsed = 0;
      setActive(live.current.active);
      if (!reduced) setAnim({ i: from, type: 'out', dir, id: Date.now() });
      setAnnounce(`Story ${live.current.active + 1} of ${n}: ${TESTIMONIALS[live.current.active].name}`);
    },
    [n, reduced]
  );

  useEffect(() => {
    live.current.paused = paused;
  }, [paused]);

  // clear the throw animation once it has played
  useEffect(() => {
    if (!anim) return undefined;
    const t = setTimeout(() => setAnim(null), 950);
    return () => clearTimeout(t);
  }, [anim]);

  // only run the timer while the section is on screen
  useEffect(() => {
    const el = deckRef.current;
    if (!el || !('IntersectionObserver' in window)) {
      live.current.inView = true;
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => (live.current.inView = e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // timer + scooter on the road (one rAF loop, no re-renders)
  useEffect(() => {
    let raf;
    let last = performance.now();
    const stop = (i) => (i + 0.5) / n;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const L = live.current;
      const running = !reduced && !L.paused && L.inView && !L.drag && n > 1;
      if (running) L.elapsed += dt * 1000;
      const p = Math.min(1, L.elapsed / AUTOPLAY_MS);
      const a = L.active;
      const target = a < n - 1 ? stop(a) + (stop(a + 1) - stop(a)) * p : stop(a) + (1 - stop(a)) * p;
      if (L.x == null || reduced) L.x = target;
      const prev = L.x;
      L.x += (target - L.x) * (1 - Math.exp(-dt * 7));
      const sc = scooterRef.current;
      const road = roadRef.current;
      if (sc && road) {
        const v = (L.x - prev) / Math.max(dt, 1e-3);
        sc.style.setProperty('--px', `${L.x * road.clientWidth}px`);
        if (Math.abs(v) > 0.004) sc.dataset.facing = v < 0 ? 'left' : 'right';
        sc.classList.toggle('is-moving', Math.abs(v) > 0.004);
      }
      if (running && L.elapsed >= AUTOPLAY_MS) go(a + 1, 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n, reduced, go]);

  /* ---- top card: tilt on hover, drag / swipe to throw ---- */
  const topCard = () => deckRef.current?.querySelector('.tx-card.is-top');
  const onPointerMove = (e) => {
    const card = topCard();
    if (!card) return;
    const d = live.current.drag;
    if (d) {
      const dx = e.clientX - d.x0;
      d.dx = dx;
      card.style.setProperty('--drag', `${dx}px`);
      card.style.setProperty('--dragr', `${dx * 0.06}deg`);
      return;
    }
    if (reduced || e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--tx', `${((e.clientY - r.top) / r.height - 0.5) * -7}deg`);
    card.style.setProperty('--ty', `${((e.clientX - r.left) / r.width - 0.5) * 9}deg`);
  };
  const resetTilt = () => {
    const card = topCard();
    card?.style.setProperty('--tx', '0deg');
    card?.style.setProperty('--ty', '0deg');
  };
  const onPointerDown = (e) => {
    if (e.button !== 0 || !e.target.closest('.tx-card.is-top') || e.target.closest('button')) return;
    live.current.drag = { x0: e.clientX, dx: 0 };
    topCard()?.classList.add('is-dragging');
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerUp = () => {
    const d = live.current.drag;
    if (!d) return;
    live.current.drag = null;
    const card = topCard();
    card?.classList.remove('is-dragging');
    card?.style.setProperty('--drag', '0px');
    card?.style.setProperty('--dragr', '0deg');
    if (Math.abs(d.dx) > SWIPE_PX) throwTop(d.dx > 0 ? 1 : -1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(active + 1, 1, true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(active - 1, -1, true);
    }
  };

  return (
    <section id="testimonials" className="panel panel-center testimonials" aria-labelledby="testimonials-title">
      <div className="panel-body">
        <p className="eyebrow">Rider stories</p>
        <h2 id="testimonials-title">
          Riders who <span className="gold-text">earn with us.</span>
        </h2>

        <div
          className={`tx${paused ? ' is-paused' : ''}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => {
            setPaused(false);
            resetTilt();
          }}
          onFocus={() => setPaused(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
        >
          <div
            className="tx-deck"
            ref={deckRef}
            role="group"
            aria-roledescription="carousel"
            aria-label="Rider stories. Use the left and right arrow keys to move between stories."
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {TESTIMONIALS.map((r, i) => {
              const depth = (i - active + n) % n;
              const animating = anim && anim.i === i;
              return (
                <figure
                  key={animating ? `${i}-${anim.id}` : i}
                  className={`tx-card${depth === 0 ? ' is-top' : ''}${animating ? ` is-${anim.type}` : ''}`}
                  style={{ ...packPose(depth), '--dir': animating ? anim.dir : 1 }}
                  aria-hidden={depth !== 0}
                  inert={depth !== 0}
                >
                  <div className="tx-card-in">
                    <div className="tx-top">
                      <span className="tx-mark" aria-hidden="true">
                        &ldquo;
                      </span>
                      <span className="tx-ticket-no" aria-hidden="true">
                        Ride {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
                      </span>
                    </div>
                    <blockquote>
                      <p>
                        <Quote text={r.quote} highlight={r.highlight} />
                      </p>
                    </blockquote>
                    <figcaption className="tx-stub">
                      <span className="tx-avatar" aria-hidden="true">
                        {initials(r.name)}
                      </span>
                      <span className="tx-who">
                        <strong>{r.name}</strong>
                        <span>
                          {r.platform} rider · {r.area}
                        </span>
                      </span>
                      <span className="tx-since">
                        <small>Riding with us</small>
                        <b>{r.since}</b>
                      </span>
                    </figcaption>
                  </div>
                </figure>
              );
            })}
          </div>

          <div className="tx-controls">
            <button type="button" className="tx-arrow" aria-label="Previous story" onClick={() => go(active - 1, -1, true)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>

            <div className="tx-road" ref={roadRef}>
              <span className="tx-lane" aria-hidden="true" />
              <div className="tx-scooter" ref={scooterRef} data-facing="right" aria-hidden="true">
                <MiniScooter />
              </div>
              <div className="tx-stops" role="tablist" aria-label="Riders">
                {TESTIMONIALS.map((r, i) => (
                  <button
                    key={r.name}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={`${r.name}, ${r.platform} rider`}
                    className={`tx-stop${i === active ? ' is-active' : ''}${i < active ? ' is-past' : ''}`}
                    style={{ left: `${((i + 0.5) / n) * 100}%` }}
                    onClick={() => go(i, i > active ? 1 : -1, true)}
                  >
                    <span className="tx-stop-dot">{initials(r.name)}</span>
                    <span className="tx-stop-name">{r.platform}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="tx-arrow" aria-label="Next story" onClick={() => go(active + 1, 1, true)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <p className="tx-hint" aria-hidden="true">
            Swipe the ticket or tap a rider
          </p>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
        </div>

        {TESTIMONIALS_ARE_SAMPLES && (
          <p className="fineprint t-note">Sample testimonials for layout. Replace with real rider feedback before launch.</p>
        )}
      </div>
    </section>
  );
}
