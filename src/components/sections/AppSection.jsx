import { useEffect, useState } from 'react';
import { DAILY_RENT } from './PricingSection';

/* Line icons for the app mock-ups (24px grid, stroked). */
const ICONS = {
  bike: (
    <>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M6 17l4-8h5l3 8M10 9H8" />
    </>
  ),
  rupee: <path d="M7 5h10M7 9h10M7 5h3a4 4 0 0 1 0 8H7l7 7" />,
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8-8M16 7l2 2" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 13h5M10 17h5" />
    </>
  ),
  wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M12 9v11M4 13h16M12 9c-2-4-6-3-5 0M12 9c2-4 6-3 5 0" />
    </>
  ),
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />,
  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2M20 14v6h-4M14 18v2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  share: <path d="M12 4v11M7 9l5-5 5 5M5 14v6h14v-6" />,
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg className="ap-ico" viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** Side-view scooter thumbnail in the brand's cream and gold. */
function ScooterThumb({ electric = false }) {
  return (
    <svg className="ap-thumb" viewBox="0 0 64 40" aria-hidden="true">
      <path d="M12 28c2-9 10-12 18-12h10l4-8h6l-4 10c5 1 8 5 8 10z" fill="var(--ap-cream)" />
      <path d="M20 24h22" stroke="var(--gold-2)" strokeWidth="2" />
      <rect x="27" y="12" width="14" height="4" rx="2" fill="#2a2a30" />
      <path d="M46 8l3-5h4" stroke="var(--gold-2)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="31" r="6" fill="#16161b" stroke="#3a3a42" strokeWidth="2" />
      <circle cx="50" cy="31" r="6" fill="#16161b" stroke="#3a3a42" strokeWidth="2" />
      <circle cx="16" cy="31" r="2.5" fill="var(--gold-2)" />
      <circle cx="50" cy="31" r="2.5" fill="var(--gold-2)" />
      {electric && <path d="M33 17l-3 5h3l-2 4 5-6h-3l2-3z" fill="var(--gold-2)" />}
    </svg>
  );
}

const fmtTime = (d) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
const fmtDay = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Current time, refreshed every 15 s so the mock-ups show the real clock and date. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function StatusBar({ now }) {
  return (
    <div className="ap-status">
      <span>{fmtTime(now).replace(/\s?[ap]m$/i, '')}</span>
      <i className="ap-island" />
      <span className="ap-status-icons">
        <svg viewBox="0 0 18 12" aria-hidden="true">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5" width="3" height="7" rx="1" />
          <rect x="10" y="2.5" width="3" height="9.5" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 26 12" aria-hidden="true">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" />
          <rect x="2.5" y="2.5" width="15" height="7" rx="1.5" />
          <rect x="24" y="4" width="2" height="4" rx="1" />
        </svg>
      </span>
    </div>
  );
}

function BookingScreen({ now }) {
  return (
    <div className="ap-screen">
      <StatusBar now={now} />
      <div className="ap-topbar">
        <span className="ap-round">
          <Icon name="back" />
        </span>
        <div>
          <b>Book a bike</b>
          <small>Step 2 of 3</small>
        </div>
      </div>
      <div className="ap-steps">
        <i className="is-done" />
        <i className="is-on" />
        <i />
      </div>

      <p className="ap-label">Pickup hub</p>
      <div className="ap-field">
        <span className="ap-tile">
          <Icon name="pin" />
        </span>
        <div>
          <b>Hayathnagar hub</b>
          <small>Ragannaguda X Roads · Open now</small>
        </div>
        <Icon name="down" />
      </div>

      <p className="ap-label">Choose your bike</p>
      <div className="ap-bike is-picked">
        <ScooterThumb />
        <div>
          <b>City scooter</b>
          <small>110cc · Petrol · Insured</small>
        </div>
        <span className="ap-radio" />
      </div>
      <div className="ap-bike">
        <ScooterThumb electric />
        <div>
          <b>Electric scooter</b>
          <small>Charging included</small>
        </div>
        <span className="ap-radio" />
      </div>

      <p className="ap-label">Start date</p>
      <div className="ap-chips">
        <span className="is-on">Today</span>
        <span>Tomorrow</span>
        <span>{fmtDay(addDays(now, 2))}</span>
      </div>

      <div className="ap-footer">
        <div>
          <b>₹{DAILY_RENT}/day</b>
          <small>Deposit refundable</small>
        </div>
        <span className="ap-btn">Continue</span>
      </div>
    </div>
  );
}

const QUICK = [
  ['bike', 'Book bike'],
  ['rupee', 'Pay rent'],
  ['receipt', 'Receipts'],
  ['key', 'My bike'],
  ['doc', 'Documents'],
  ['wrench', 'Service'],
  ['chat', 'Support'],
  ['gift', 'Refer'],
];

function HomeScreen({ now }) {
  return (
    <div className="ap-screen">
      <StatusBar now={now} />
      <div className="ap-head">
        <span className="ap-avatar">R</span>
        <div>
          <b>Hi, Ravi</b>
          <small>
            <Icon name="pin" /> Hayathnagar hub
          </small>
        </div>
        <span className="ap-round ap-bell">
          <Icon name="bell" />
        </span>
        <span className="ap-round">
          <Icon name="qr" />
        </span>
      </div>

      <div className="ap-rent">
        <div className="ap-rent-top">
          <small>Today&apos;s rent · {fmtDay(now)}</small>
          <span className="ap-pill">Due 9 PM</span>
        </div>
        <strong>₹{DAILY_RENT}</strong>
        <div className="ap-rent-row">
          <small>
            <Icon name="bike" /> TS 09 ·· 4821
          </small>
          <span className="ap-btn ap-pay">Pay now</span>
        </div>
      </div>

      <div className="ap-section">
        <b>Quick actions</b>
        <small>See all</small>
      </div>
      <div className="ap-grid">
        {QUICK.map(([icon, label]) => (
          <span key={label}>
            <i>
              <Icon name={icon} />
            </i>
            {label}
          </span>
        ))}
      </div>

      <div className="ap-banner">
        <span className="ap-tile">
          <Icon name="wrench" />
        </span>
        <div>
          <b>Service due in 4 days</b>
          <small>Free check-up at your hub</small>
        </div>
        <Icon name="chevron" />
      </div>

      <nav className="ap-nav">
        <span className="is-on">
          <Icon name="home" />
          Home
        </span>
        <span>
          <Icon name="calendar" />
          Bookings
        </span>
        <span className="ap-scan">
          <i>
            <Icon name="qr" />
          </i>
        </span>
        <span>
          <Icon name="clock" />
          History
        </span>
        <span>
          <Icon name="user" />
          Profile
        </span>
      </nav>
    </div>
  );
}

function SuccessScreen({ now }) {
  const ref = `VF${now.getFullYear() % 100}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}4821`;
  return (
    <div className="ap-screen ap-success">
      <StatusBar now={now} />
      <div className="ap-done">
        <span className="ap-check">
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="M15 27l7 7 15-16" />
          </svg>
        </span>
        <b>Payment successful</b>
        <strong>₹{DAILY_RENT}</strong>
        <small>
          {fmtDay(now)} · {fmtTime(now)}
        </small>
      </div>

      <div className="ap-receipt">
        <div>
          <small>Paid to</small>
          <b>Vihaan Fleet</b>
        </div>
        <div>
          <small>For</small>
          <b>Daily rent · {fmtDay(now)}</b>
        </div>
        <div>
          <small>Bike</small>
          <b>TS 09 ·· 4821</b>
        </div>
        <div>
          <small>Paid via</small>
          <b>UPI</b>
        </div>
        <div>
          <small>Reference</small>
          <b>{ref}</b>
        </div>
      </div>

      <p className="ap-safe">
        <Icon name="shield" /> Receipt saved to History
      </p>

      <div className="ap-actions">
        <span className="ap-btn ap-ghost">
          <Icon name="share" /> Share
        </span>
        <span className="ap-btn">Done</span>
      </div>
    </div>
  );
}

export default function AppSection() {
  const now = useNow();
  return (
    <section id="app" className="panel panel-app">
      <div className="panel-body app-grid">
        <div className="app-copy">
          <p className="eyebrow">The Vihaan Fleet app</p>
          <h2>
            Your rent, your bike, <span className="gold-text">in your pocket.</span>
          </h2>
          <ul className="ticks">
            <li>Book a bike at your nearest hub</li>
            <li>See today&apos;s rent due and pay in a few taps</li>
            <li>Switch duty on and off</li>
            <li>View dues, history and receipts anytime</li>
            <li>Your bike and documents, always at hand</li>
          </ul>
          <p className="fineprint">Screens shown are illustrative.</p>
        </div>

        <div className="phones" aria-hidden="true">
          <div className="phone phone-left" data-parallax="40">
            <BookingScreen now={now} />
          </div>
          <div className="phone phone-right" data-parallax="60">
            <SuccessScreen now={now} />
          </div>
          <div className="phone phone-front" data-parallax="-50">
            <HomeScreen now={now} />
          </div>
        </div>
      </div>
    </section>
  );
}
