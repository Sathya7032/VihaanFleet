import { useEffect } from 'react';
import { CONTACT, LEGAL_PAGES } from '../content/sitePages';

function PageHead({ crumb, title, subtitle }) {
  return (
    <div className="page-head">
      <div className="page-wrap">
        <p className="breadcrumb">
          <a href="/">Home</a> / {crumb}
        </p>
        <h1>
          {title.split(' ').slice(0, -1).join(' ')}{' '}
          <span className="gold-text">{title.split(' ').slice(-1)}</span>
        </h1>
        <p className="page-sub">{subtitle}</p>
      </div>
    </div>
  );
}

export function ContactPage() {
  useEffect(() => {
    document.title = 'Contact — Vihaan Fleet';
  }, []);
  return (
    <main id="main" className="subpage">
      <PageHead crumb="Contact" title="Contact us" subtitle={CONTACT.subtitle} />
      <section className="page-wrap">
        <div className="contact-grid">
          <div className="contact-card">
            <h3>Reach us</h3>
            <p>
              <strong>Email</strong>
              <br />
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </p>
            <p>
              <strong>Phone</strong>
              <br />
              <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
            </p>
            <p>
              <strong>Hours</strong>
              <br />
              {CONTACT.hours}
            </p>
          </div>
          <div className="contact-card">
            <h3>Registered office</h3>
            <p>
              {CONTACT.office.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </div>
        </div>
        <p className="lead page-note">{CONTACT.note}</p>
        <div className="page-cta">
          <a className="btn btn-gold" href={CONTACT.phoneHref}>
            Call {CONTACT.phone}
          </a>
          <a className="btn btn-ghost" href={`mailto:${CONTACT.email}`}>
            Email us
          </a>
        </div>
      </section>
    </main>
  );
}

export function LegalPage({ page }) {
  const data = LEGAL_PAGES[page];
  useEffect(() => {
    document.title = data.docTitle;
  }, [data]);
  return (
    <main id="main" className="subpage">
      <PageHead crumb={data.title} title={data.title} subtitle={data.subtitle} />
      {/* Static, first-party legal copy (src/content/sitePages.js). */}
      <article className="page-wrap prose" dangerouslySetInnerHTML={{ __html: data.html }} />
    </main>
  );
}
