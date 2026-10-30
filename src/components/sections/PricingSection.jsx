import { useEffect, useRef } from 'react';
import { posesFor } from '../../three/stagePoses';
import { scooterBox } from '../../three/scooterBox';

export const DAILY_RENT = 299;
const STATS_GAP = 28; // px between the scooter's tyres and the stats

export default function PricingSection() {
  const ref = useRef(null);

  // Line the stats up under the scooter parked on this section (it is fixed to the viewport).
  useEffect(() => {
    const el = ref.current;
    const layout = () => {
      const w = document.documentElement.clientWidth;
      const h = window.innerHeight;
      const box = scooterBox(posesFor(w, h).pricing, w, h);
      el.style.setProperty('--ps-top', `${box.top + box.height + STATS_GAP}px`);
      el.style.setProperty('--ps-left', `${box.left}px`);
      el.style.setProperty('--ps-w', `${box.width}px`);
    };
    layout();
    window.addEventListener('resize', layout);
    return () => window.removeEventListener('resize', layout);
  }, []);

  return (
    <section id="pricing" className="panel panel-right" ref={ref}>
      <div className="panel-body">
        <p className="eyebrow">Rental plan &amp; pricing</p>
        <h2>
          One simple price. <span className="gold-text">No surprises.</span>
        </h2>
        <div className="price-card">
          <div className="price-amount">
            <span className="rupee">₹</span>
            <span data-count={DAILY_RENT} data-duration="1600">
              {DAILY_RENT}
            </span>
            <small>/day</small>
          </div>
          <ul className="ticks">
            <li>Pay as you ride</li>
            <li>Maintenance &amp; on-road support included</li>
            <li>Insured, document-ready bike</li>
            <li>Refundable security deposit</li>
            <li>No long lock-ins</li>
          </ul>
          <a className="btn btn-gold" href="/contact">
            Enquire now
          </a>
        </div>
      </div>

      {/* spans the section; the stats stick just under the parked scooter while it is here */}
      <div className="price-stats-rail">
        <div className="stats">
          <div>
            <strong data-count="6">6</strong>
            <span>platforms to earn on</span>
          </div>
          <div>
            <strong data-count="4">4</strong>
            <span>steps to start</span>
          </div>
          <div>
            <strong data-count="0">0</strong>
            <span>lock-in days</span>
          </div>
        </div>
      </div>
    </section>
  );
}
