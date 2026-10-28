const FAQS = [
  {
    q: 'What do I need to get a bike?',
    a: 'Your ID and driving licence for a quick KYC check, and the refundable security deposit at onboarding.',
  },
  { q: 'Where do you operate?', a: 'We rent two-wheelers to gig and delivery riders across Hyderabad.' },
  {
    q: 'How do I pay the daily rent?',
    a: 'Securely in the Vihaan Fleet app or online. You can see dues, history and receipts anytime.',
  },
  {
    q: 'Can I return the bike?',
    a: 'Yes. Rent by the day and return whenever you are done. There are no long lock-ins.',
  },
];

export function FaqSection() {
  return (
    <section className="panel panel-center faq" id="faq">
      <div className="panel-body">
        <p className="eyebrow">Questions</p>
        <h2>Quick answers.</h2>
        {FAQS.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
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
