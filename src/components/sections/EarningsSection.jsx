import { useEffect, useId, useRef, useState } from 'react';

/** Daily rent on the website's rental plan. */
const DAILY_RENT = 299;

/** Example starting values; every one can be changed with its slider. */
const FIELDS = [
  { key: 'orders', label: 'Orders a day', min: 5, max: 45, step: 1, value: 22, fmt: (v) => `${v}` },
  { key: 'payout', label: 'Average pay per order', min: 20, max: 90, step: 1, value: 38, fmt: (v) => `₹${v}` },
  { key: 'fuel', label: 'Fuel or charging a day', min: 0, max: 300, step: 10, value: 60, fmt: (v) => `₹${v}` },
  { key: 'days', label: 'Days you ride a month', min: 15, max: 30, step: 1, value: 26, fmt: (v) => `${v}` },
];

const inr = (n) => `${n < 0 ? '−' : ''}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

/** Number that glides to its new value instead of jumping. */
function Tween({ value, format = inr }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const start = from.current;
    if (reduced || start === value) {
      from.current = value;
      setShown(value);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 550);
      const v = start + (value - start) * (1 - Math.pow(1 - t, 3));
      from.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return format(shown);
}

function Slider({ field, value, onChange }) {
  const id = useId();
  const pct = ((value - field.min) / (field.max - field.min)) * 100;
  return (
    <div className="ec-field">
      <div className="ec-field-head">
        <label htmlFor={id}>{field.label}</label>
        <output htmlFor={id}>{field.fmt(value)}</output>
      </div>
      <input
        id={id}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        style={{ '--p': `${pct}%` }}
        onChange={(e) => onChange(field.key, Number(e.target.value))}
      />
    </div>
  );
}

/**
 * "What you take home": an earnings calculator. The rider sets their own
 * orders, pay per order, fuel and riding days; the daily rent comes off and
 * the result (per day and per month) animates as the sliders move.
 */
export default function EarningsSection() {
  const [vals, setVals] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, f.value])));
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));

  const gross = vals.orders * vals.payout;
  const costs = DAILY_RENT + vals.fuel;
  const net = gross - costs;
  const monthly = net * vals.days;
  const breakEven = Math.ceil(costs / vals.payout);
  const share = (n) => (gross > 0 ? Math.max(0, Math.min(100, (n / Math.max(gross, costs)) * 100)) : 0);

  return (
    <section id="earnings" className="panel earnings" aria-labelledby="earnings-title">
      <div className="panel-body">
        <div className="ec-intro">
          <p className="eyebrow">Earnings calculator</p>
          <h2 id="earnings-title">
            See what you <span className="gold-text">take home.</span>
          </h2>
          <p className="lead">
            Move the sliders to match how you ride. We take off the daily rent of {inr(DAILY_RENT)} and your fuel, and show
            what stays in your pocket.
          </p>
        </div>

        <div className="ec">
          <div className="ec-inputs">
            {FIELDS.map((f) => (
              <Slider key={f.key} field={f} value={vals[f.key]} onChange={set} />
            ))}
            <p className="ec-fine">
              Starting values are only an example. Check your platform app for your real pay per order.
            </p>
          </div>

          <div className="ec-result" aria-live="polite">
            <p className="ec-label">You take home</p>
            <p className={`ec-big${net < 0 ? ' is-neg' : ''}`}>
              <Tween value={monthly} />
              <small>/month</small>
            </p>
            <p className="ec-day">
              Over {vals.days} riding days a month
            </p>

            <div className="ec-bar" aria-hidden="true">
              <span className="ec-seg ec-seg-rent" style={{ width: `${share(DAILY_RENT)}%` }} />
              <span className="ec-seg ec-seg-fuel" style={{ width: `${share(vals.fuel)}%` }} />
              <span className="ec-seg ec-seg-you" style={{ width: `${share(Math.max(0, net))}%` }} />
            </div>

            <dl className="ec-rows">
              <div>
                <dt>Earned a day</dt>
                <dd>
                  <Tween value={gross} />
                </dd>
              </div>
              <div>
                <dt>
                  <i className="ec-dot ec-dot-rent" /> Bike rent
                </dt>
                <dd>−{inr(DAILY_RENT)}</dd>
              </div>
              <div>
                <dt>
                  <i className="ec-dot ec-dot-fuel" /> Fuel or charging
                </dt>
                <dd>
                  <Tween value={-vals.fuel} />
                </dd>
              </div>
              <div className="ec-keep">
                <dt>
                  <i className="ec-dot ec-dot-you" /> You keep a day
                </dt>
                <dd>
                  <Tween value={net} />
                </dd>
              </div>
            </dl>

            <p className="ec-break">
              <strong>{breakEven} orders</strong> cover your rent and fuel each day. Every order after that is yours.
            </p>
            <a className="btn btn-gold ec-cta" href="/book-bike">
              Get a bike
            </a>
          </div>
        </div>
        <p className="fineprint ec-note">
          An estimate only. Real earnings depend on your platform, city, hours and incentives. Maintenance and insurance are
          included in the rent.
        </p>
      </div>
    </section>
  );
}
