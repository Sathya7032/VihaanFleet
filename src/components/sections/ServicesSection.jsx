import { useEffect, useRef, useState } from 'react';
import { posesFor, servicesLayout } from '../../three/stagePoses';
import { scooterBox } from '../../three/scooterBox';

const SERVICES = [
  {
    title: 'Two-wheeler rentals',
    tag: 'Pay as you ride',
    text: 'Company-owned scooters and bikes on a simple daily rental. Pay as you ride.',
    icon: (
      <>
        <circle cx="6" cy="17" r="3" />
        <circle cx="18" cy="17" r="3" />
        <path d="M6 17l4-8h5l3 8M10 9H8" />
      </>
    ),
  },
  {
    title: 'Fully maintained',
    tag: 'Service included',
    text: 'Regular servicing and on-road support included. Breakdowns are our problem, not yours.',
    icon: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z" />,
  },
  {
    title: 'Insured & compliant',
    tag: 'Road legal',
    text: 'Valid insurance and vehicle documents on every bike, so you ride legally and safely.',
    icon: (
      <>
        <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    title: 'Simple app payments',
    tag: 'In-app',
    text: 'Pay your rent securely in the app. Track dues, history and receipts anytime.',
    icon: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
  },
  {
    title: 'Quick onboarding',
    tag: 'One-time KYC',
    text: 'Fast KYC and bike assignment. Submit your documents once and get riding.',
    icon: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4M10 13h5M10 17h5" />
      </>
    ),
  },
  {
    title: 'No lock-ins',
    tag: 'Return anytime',
    text: 'Rent by the day and return whenever you are done. Terms that fit your work.',
    icon: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 7.5-2" />
      </>
    ),
  },
];

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const pad = (n) => String(n).padStart(2, '0');

/** How far the pinned section has been scrolled through, 0..1. */
function pinProgress(el) {
  const r = el.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  return span > 0 ? clamp01(-r.top / span) : 0;
}

/**
 * "What we do": pinned while you scroll; each scroll step shows the next
 * service in a panel beside the scooter, sized and placed to match the
 * scooter's on-screen box.
 */
export default function ServicesSection() {
  const ref = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    let raf = 0;
    const layout = () => {
      const w = document.documentElement.clientWidth;
      const h = window.innerHeight;
      const box = scooterBox(posesFor(w, h).services, w, h);
      const lay = w > 860 ? servicesLayout(w, h) : null;
      if (lay) {
        el.style.setProperty('--copy-w', `${lay.copyW}px`);
        el.style.setProperty('--panel-w', `${lay.panelW}px`);
      }
      el.style.setProperty('--sc-left', `${box.left}px`);
      el.style.setProperty('--sc-top', `${box.top}px`);
      el.style.setProperty('--sc-h', `${box.height}px`);
    };
    const update = () => {
      raf = 0;
      // detail panel slides in as the scooter arrives
      el.classList.toggle('is-in', el.getBoundingClientRect().top < window.innerHeight * 0.45);
      const p = pinProgress(el);
      const f = p * SERVICES.length;
      const i = Math.min(SERVICES.length - 1, Math.floor(f));
      el.style.setProperty('--step-p', String(f - i));
      setActive(i);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      layout();
      onScroll();
    };
    layout();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section id="services" className="services" ref={ref} style={{ '--steps': SERVICES.length }}>
      <div className="svc-pin">
        <div className="panel-body svc-copy">
          <p className="eyebrow">What we do</p>
          <h2>
            Everything you need to <span className="gold-text">start earning today.</span>
          </h2>
          <p className="lead svc-lead">
            We own and manage the fleet. You ride, earn and pay a simple daily rent. Every bike comes serviced,
            insured and document-ready.
          </p>
        </div>

        <div className="svc-panel" aria-live="polite">
          {SERVICES.map((s, i) => (
            <article
              key={s.title}
              className={`svc-detail${i === active ? ' is-active' : i < active ? ' is-past' : ''}`}
              aria-hidden={i !== active}
            >
              <div className="svc-detail-head">
                <div className="svc-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {s.icon}
                  </svg>
                </div>
                <span className="svc-count">
                  {pad(i + 1)}
                  <small> / {pad(SERVICES.length)}</small>
                </span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <span className="svc-tag">{s.tag}</span>
            </article>
          ))}
          <span className="svc-progress" aria-hidden="true" />
          <span className="svc-link" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
