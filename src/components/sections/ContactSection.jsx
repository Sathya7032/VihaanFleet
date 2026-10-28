import { useEffect, useRef, useState } from 'react';
import { CONTACT } from '../../content/sitePages';

const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(CONTACT.mapQuery)}&z=15&output=embed`;
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CONTACT.mapQuery)}`;

/** Current day + hour in India, whatever the visitor's own time zone. */
function istNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, hour: Number(get('hour')) + Number(get('minute')) / 60 };
}

function readClock() {
  const { day, hour } = istNow();
  return { hour, open: CONTACT.openDays.includes(day) && hour >= CONTACT.openHour && hour < CONTACT.closeHour };
}

/** Live India time + open state, refreshed every 30 s. */
function useClock() {
  const [clock, setClock] = useState(readClock);
  useEffect(() => {
    const id = window.setInterval(() => setClock(readClock()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return clock;
}

const fmtTime = (h) => {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
};

/** Point on a 24-hour dial (midnight at the top). */
const dial = (h, r, c = 30) => {
  const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
  return [c + r * Math.cos(a), c + r * Math.sin(a)];
};

/** 24-hour dial: gold arc = opening hours, needle = India time now. */
function HoursDial({ hour, open }) {
  const [x1, y1] = dial(CONTACT.openHour, 24);
  const [x2, y2] = dial(CONTACT.closeHour, 24);
  const large = CONTACT.closeHour - CONTACT.openHour > 12 ? 1 : 0;
  const [nx, ny] = dial(hour, 19);
  return (
    <svg className={`cx-dial${open ? ' is-open' : ''}`} viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="24" className="cx-dial-track" />
      <path d={`M${x1} ${y1}A24 24 0 ${large} 1 ${x2} ${y2}`} className="cx-dial-arc" pathLength="1" />
      {[0, 6, 12, 18].map((h) => {
        const [a, b] = dial(h, 28.5);
        const [c, d] = dial(h, 26.5);
        return <path key={h} d={`M${a} ${b}L${c} ${d}`} className="cx-dial-tick" />;
      })}
      <line x1="30" y1="30" x2={nx} y2={ny} className="cx-dial-needle" />
      <circle cx="30" cy="30" r="2.6" className="cx-dial-hub" />
    </svg>
  );
}

/** Phone number that rolls into place digit by digit, like an odometer. */
function RollingNumber({ text }) {
  let n = 0;
  return (
    <span className="cx-odo" aria-hidden="true">
      {text.split('').map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={i} className="cx-odo-sep">
              {ch === ' ' ? '\u00a0' : ch}
            </span>
          );
        }
        const k = n++;
        return (
          <span key={i} className="cx-odo-col" style={{ '--d': Number(ch), '--k': k }}>
            <span>
              {'0123456789'.split('').map((dg) => (
                <span key={dg}>{dg}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);

/**
 * Homepage "Contact & location": a "dispatch console" of contact tiles beside
 * a dark, gold-tinted map. When it scrolls into view the tiles trace in one
 * by one, the phone number rolls into place, the hours dial sweeps to the
 * current India time, and the map opens from the office with a pin drop and
 * a locator sweep.
 */
export default function ContactSection() {
  const { hour, open } = useClock();
  const layoutRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = layoutRef.current;
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="contact" className="panel contact-home" aria-labelledby="contact-title">
      <div className="panel-body">
        <p className="eyebrow">Contact &amp; location</p>
        <h2 id="contact-title">
          Talk to us. <span className="gold-text">Visit us in Hayathnagar.</span>
        </h2>

        <div className={`contact-layout cx${inView ? ' is-in' : ''}`} ref={layoutRef}>
          <div className="contact-list">
            <a className="contact-tile contact-tile-main" href={CONTACT.phoneHref} style={{ '--n': 0 }} aria-label={`Call us on ${CONTACT.phone}`}>
              <Icon>
                <path className="cx-handset" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                <path className="cx-wave cx-wave-1" d="M15 3.5a6 6 0 0 1 5.5 5.5" />
                <path className="cx-wave cx-wave-2" d="M15 7a2.6 2.6 0 0 1 2 2" />
              </Icon>
              <span className="contact-tile-text">
                <small>Call us</small>
                <strong>
                  <RollingNumber text={CONTACT.phone} />
                </strong>
              </span>
              <span className="contact-go" aria-hidden="true">
                →
              </span>
            </a>

            <a className="contact-tile" href={`mailto:${CONTACT.email}`} style={{ '--n': 1 }}>
              <Icon>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path className="cx-flap" d="M3 7l9 6 9-6" />
              </Icon>
              <span className="contact-tile-text">
                <small>Email</small>
                <strong>{CONTACT.email}</strong>
              </span>
              <span className="contact-go" aria-hidden="true">
                →
              </span>
            </a>

            <div className="contact-tile cx-hours" style={{ '--n': 2 }}>
              <HoursDial hour={hour} open={open} />
              <span className="contact-tile-text">
                <small>Hours</small>
                <strong>Mon – Sat · 9 AM – 7 PM</strong>
                <span className="cx-now">In Hyderabad it&rsquo;s {fmtTime(hour)}</span>
              </span>
              <span className={`open-badge ${open ? 'is-open' : ''}`}>
                <i aria-hidden="true" />
                {open ? 'Open now' : 'Closed'}
              </span>
            </div>

            <div className="contact-tile contact-address" style={{ '--n': 3 }}>
              <Icon>
                <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </Icon>
              <span className="contact-tile-text">
                <small>Registered office</small>
                <address>
                  {CONTACT.office.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
              </span>
            </div>
          </div>

          <figure className="map-card">
            <div className="map-frame">
              <iframe
                title="Map: Vihaan Fleet office, Hayathnagar, Hyderabad"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {/* locator overlay: sweep + rings + dropped pin at the office (map centre) */}
              <div className="cx-locator" aria-hidden="true">
                <span className="cx-sweep" />
                <span className="cx-ring" />
                <span className="cx-ring cx-ring-2" />
                <span className="cx-drop">
                  <svg viewBox="0 0 32 42">
                    <path d="M16 41S3 26.5 3 15.5a13 13 0 0 1 26 0C29 26.5 16 41 16 41z" />
                    <circle cx="16" cy="15.5" r="5" />
                  </svg>
                </span>
                <span className="cx-shadow" />
              </div>
            </div>
            <figcaption className="map-caption">
              <span className="map-pin" aria-hidden="true">
                <i />
              </span>
              <span>
                <strong>Vihaan Fleet</strong>
                <small>Ragannaguda X Roads, Hayathnagar</small>
              </span>
              <a className="btn btn-gold map-btn" href={directionsUrl} target="_blank" rel="noreferrer">
                Get directions
              </a>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
