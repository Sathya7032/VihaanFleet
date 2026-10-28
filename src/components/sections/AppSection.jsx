export default function AppSection() {
  return (
    <section id="app" className="panel panel-app">
      <div className="panel-body app-grid">
        <div className="app-copy">
          <p className="eyebrow">The Vihaan Fleet app</p>
          <h2>
            Your rent, your bike, <span className="gold-text">in your pocket.</span>
          </h2>
          <ul className="ticks">
            <li>See today&apos;s rent due and pay in a few taps</li>
            <li>Switch duty on and off</li>
            <li>View dues, history and receipts anytime</li>
            <li>Your bike and documents, always at hand</li>
          </ul>
          <p className="fineprint">Screens shown are illustrative.</p>
        </div>

        <div className="phones" aria-hidden="true">
          <div className="phone phone-back" data-parallax="40">
            <div className="phone-notch" />
            <div className="screen">
              <p className="screen-tag">Receipts</p>
              <div className="receipt">
                <span>Rent</span>
                <b>₹299</b>
              </div>
              <div className="receipt">
                <span>Rent</span>
                <b>₹299</b>
              </div>
              <div className="receipt">
                <span>Rent</span>
                <b>₹299</b>
              </div>
              <div className="receipt paid">
                <span>All paid</span>
                <b>✓</b>
              </div>
            </div>
          </div>
          <div className="phone phone-front" data-parallax="-50">
            <div className="phone-notch" />
            <div className="screen">
              <p className="screen-tag">Driver app</p>
              <p className="screen-hello">Hi Ravi 👋</p>
              <div className="due-card">
                <span>Today&apos;s rent due</span>
                <strong>₹299</strong>
                <div className="pay-btn">Pay now</div>
              </div>
              <div className="duty-row">
                <span>On duty</span>
                <i className="toggle" />
              </div>
              <div className="bike-row">
                <span>Your bike</span>
                <b>TS 09 ·· 4821</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
