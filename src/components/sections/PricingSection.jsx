import { useEffect, useRef } from 'react';
import { POSES, posesFor } from '../../three/stagePoses';
import { MAX_HEIGHT_SHARE, MODEL_HEIGHT, MODEL_LENGTH, scooterBox } from '../../three/scooterBox';
import { setPricingPose } from '../../three/pricingLayout';

export const DAILY_RENT = 299;
const STATS_GAP = 28; // px between the scooter's tyres and the stats
const COL_GAP = 64; // px between the scooter/stats column and the price column (desktop)
const COL_MAX = 520; // px, widest the scooter/stats column gets
const STATS_H = [112, 140]; // px, the one-row stats grid's height range
const MODEL_OVERSHOOT = 1.025; // the mirrors stand slightly above the model's nominal height on screen
const CAP_TOP = 0.2; // capital letters start about this far (x font size) below the half-leading

/** Layout offset of el inside ancestor (ignores the reveal's translate, which also makes it an offsetParent). */
function offsetIn(el, ancestor) {
  let x = 0;
  let y = 0;
  for (let n = el; n && n !== ancestor; n = n.offsetParent) {
    x += n.offsetLeft;
    y += n.offsetTop;
  }
  return { x, y };
}

export default function PricingSection() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const pin = el.querySelector('.price-pin');
    const copy = el.querySelector('.price-copy');
    const set = (k, v) => el.style.setProperty(k, `${v}px`);
    const layout = () => {
      const w = document.documentElement.clientWidth;
      const h = window.innerHeight;
      if (w <= 860) {
        // Mobile: one column; the stats stick just under the scooter parked below the card.
        const box = scooterBox(posesFor(w, h).pricing, w, h);
        set('--ps-top', box.top + box.height + STATS_GAP);
        el.style.removeProperty('--ps-h');
        setPricingPose(null);
        return;
      }
      // Desktop: the section pins, so these offsets inside the pin are viewport positions
      // while the scooter is parked. Scooter top = eyebrow top; stats bottom = price card bottom.
      // top of the eyebrow's capital letters (its box starts above them by the half-leading)
      const eyebrow = copy.querySelector('.eyebrow');
      const cs = getComputedStyle(eyebrow);
      const fs = parseFloat(cs.fontSize);
      const lh = parseFloat(cs.lineHeight) || fs * 1.2;
      const top = offsetIn(eyebrow, pin).y + (lh - fs) / 2 + fs * CAP_TOP;
      const card = copy.querySelector('.price-card');
      const bottom = offsetIn(card, pin).y + card.offsetHeight;
      const left = offsetIn(el.querySelector('.price-body'), pin).x;
      const width = Math.min(COL_MAX, offsetIn(copy, pin).x - COL_GAP - left);
      const sh = Math.max(
        60,
        Math.min(MAX_HEIGHT_SHARE * h, (width * MODEL_HEIGHT) / MODEL_LENGTH, bottom - top - STATS_GAP - STATS_H[0])
      );
      // stats end on the card's bottom edge; any spare height goes to the gap above them
      const ground = top + sh * MODEL_OVERSHOOT; // tyres, so the mirror tips land on `top`
      const statsTop = bottom - Math.min(STATS_H[1], Math.max(STATS_H[0], bottom - ground - STATS_GAP));
      set('--ps-top', statsTop);
      set('--ps-h', bottom - statsTop);
      set('--ps-left', left);
      set('--ps-w', width);
      setPricingPose({
        nx: ((left + width / 2) / w) * 2 - 1, // centred over the stats
        ny: 1 - (2 * ground) / h,
        size: (sh * MODEL_LENGTH) / MODEL_HEIGHT / w,
        rotY: POSES.desktop.pricing.rotY,
      });
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(copy);
    window.addEventListener('resize', layout);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', layout);
      setPricingPose(null);
    };
  }, []);

  return (
    <section id="pricing" className="pricing" ref={ref}>
      {/* desktop: pins while the scooter is parked beside the price */}
      <div className="price-pin">
        <div className="panel-body price-body">
          <div className="price-copy">
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
                <li>Refundable security deposit</li>
              </ul>
              <a className="btn btn-gold" href="/contact">
                Enquire now
              </a>
            </div>
          </div>
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
          <div>
            <strong className="pct" data-count="100">
              100
            </strong>
            <span>bikes insured</span>
          </div>
        </div>
      </div>
    </section>
  );
}
