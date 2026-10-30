import { DAILY_RENT } from './PricingSection';

// Two columns of four: getting started on the left, what is covered on the right.
const FAQS = [
  {
    q: 'What do I need to get a bike?',
    a: 'Your ID and driving licence for a quick KYC check, and the refundable security deposit at onboarding.',
  },
  {
    q: 'How much is the rent?',
    a: `₹${DAILY_RENT} a day, and you pay as you ride. The security deposit is refundable.`,
  },
  {
    q: 'How do I pay the daily rent?',
    a: 'Securely in the Vihaan Fleet app or online. You can see dues, history and receipts anytime.',
  },
  {
    q: 'Can I return the bike?',
    a: 'Yes. Rent by the day and return whenever you are done. There are no long lock-ins.',
  },
  { q: 'Where do you operate?', a: 'We rent two-wheelers to gig and delivery riders across Hyderabad.' },
  {
    q: 'Is maintenance included?',
    a: 'Yes. Regular servicing and on-road support are included. Breakdowns are our problem, not yours.',
  },
  {
    q: 'Is the bike insured?',
    a: 'Every bike comes with valid insurance and vehicle documents, so you ride legally and safely.',
  },
  {
    q: 'Which platforms can I ride for?',
    a: 'Uber, Ola, Rapido, Zomato, Swiggy, Zepto and more.',
  },
];
const FAQ_COLUMNS = [FAQS.slice(0, 4), FAQS.slice(4)];

export function FaqSection() {
  return (
    <section className="panel faq" id="faq">
      <div className="panel-body">
        <p className="eyebrow">Questions</p>
        <h2>
          Quick <span className="gold-text">answers.</span>
        </h2>
        <div className="faq-grid">
          {FAQ_COLUMNS.map((col, i) => (
            <div className="faq-col" key={i}>
              {col.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section id="cta" className="panel panel-center cta">
      <div className="panel-body">
        <h2>
          Ready to start <span className="gold-text">earning?</span>
        </h2>
        <p className="lead">Get a well-maintained, insured two-wheeler today and hit the road.</p>
        <a className="btn btn-gold btn-big" href="/book-bike">
          Get a bike
        </a>
      </div>
    </section>
  );
}
