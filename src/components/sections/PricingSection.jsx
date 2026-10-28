const DAILY_RENT = 299;

export default function PricingSection() {
  return (
    <section id="pricing" className="panel panel-right">
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
