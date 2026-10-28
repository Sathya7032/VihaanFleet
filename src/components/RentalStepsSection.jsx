import { useEffect, useRef } from 'react';

const STEPS = [
  { title: 'Sign up & complete KYC', text: 'Share your ID and driving licence for a quick verification.' },
  { title: 'Get your bike assigned', text: 'Pay the refundable deposit and collect a ready-to-ride, insured vehicle.' },
  { title: 'Ride & earn', text: 'Work on Uber, Ola, Rapido, Zomato, Swiggy, Zepto and more.' },
  { title: 'Pay rent easily', text: 'Pay your daily rent in the app. View dues and receipts anytime.' },
];

/**
 * "How it works": a pinned section. While it is pinned, scrolling drives the
 * background scooter along the gold route through steps 1 -> 4 (stage +
 * three/howRoute.js); it parks on step 4, and reverses when you scroll up.
 * The outer track supplies the extra scroll distance; the inner panel sticks.
 */
export default function RentalStepsSection() {
  const trackRef = useRef(null);
  const pinRef = useRef(null);

  // Track height = pinned panel height + ride distance; panels taller than
  // the viewport pin by their bottom edge so nothing is ever cut off.
  useEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!track || !pin) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const measure = () => {
      const h = pin.offsetHeight;
      const vh = window.innerHeight;
      track.style.setProperty('--pin-top', `${Math.min(0, vh - h)}px`);
      track.style.setProperty('--track-h', reduced ? 'auto' : `${h + vh * (vh > 700 ? 1.6 : 1.3)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pin);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <section id="how" className="how-track" ref={trackRef}>
      <div className="panel panel-wide how-pin" ref={pinRef}>
        <div className="panel-body">
          <p className="eyebrow">How it works</p>
          <h2>
            From sign-up to <span className="gold-text">earning in four steps.</span>
          </h2>
          <div className="route" id="route">
            <div className="route-line">
              <i id="route-fill" />
            </div>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="step-n">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
