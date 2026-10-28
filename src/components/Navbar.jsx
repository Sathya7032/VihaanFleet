import { useEffect, useState } from 'react';
import BrandMark from './brand/BrandMark';

const NAV_LINKS = [
  { name: 'Services', href: '/#services' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'How it works', href: '/#how' },
  { name: 'The app', href: '/#app' },
  { name: 'Contact', href: '/#contact' },
];

/**
 * Fixed glass header: V + "Vihaan Fleet" lock-up, section links, gold CTA,
 * and a mobile menu. `logoState` / `logoIconRef` let the intro hide the logo
 * (without layout shift) and measure where to land the flying logo.
 */
export default function Navbar({ logoState = 'shown', logoIconRef }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth > 860 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="nav">
        <a className="brand" href="/" aria-label="Vihaan Fleet home">
          <BrandMark state={logoState} markRef={logoIconRef} />
        </a>

        <nav className="nav-links" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.name}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a className="btn btn-gold" href="/book-bike">
            Get a bike
          </a>
          <button
            className="menu-btn"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <nav
        className="mobile-menu"
        id="mobile-menu"
        aria-label="Mobile"
        hidden={!open}
        onClick={(e) => e.target.closest('a') && setOpen(false)}
      >
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.name}
          </a>
        ))}
      </nav>
    </header>
  );
}
