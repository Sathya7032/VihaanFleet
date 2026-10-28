import BrandMark from './brand/BrandMark';

export default function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="foot-grid">
        <div>
          <a className="brand" href="/" aria-label="Vihaan Fleet home">
            <BrandMark />
          </a>
          <p className="legal">
            VIHAAN FLEET PRIVATE LIMITED · Hayathnagar, K.V. Rangareddy, Telangana – 501510, India
            <br />© {new Date().getFullYear()} Vihaan Fleet Private Limited. All rights reserved.
          </p>
        </div>
        <nav aria-label="Company">
          <strong>Company</strong>
          <a href="/#services">Services</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#contact">Contact</a>
        </nav>
        <nav aria-label="Legal">
          <strong>Legal</strong>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms &amp; Conditions</a>
          <a href="/refund">Refund &amp; Cancellation</a>
        </nav>
      </div>
      {/* Required by the model's CC BY 3.0 licence - keep this credit. */}
      <p className="credit">
        3D scooter: &quot;Vespa&quot; by Jasmine Roberts via{' '}
        <a href="https://poly.pizza/m/blGLclvvdEM" target="_blank" rel="noreferrer">
          Poly Pizza
        </a>
        , licensed{' '}
        <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">
          CC BY 3.0
        </a>
        . Recoloured.
        <br />
        Uber, Ola, Rapido, Zomato, Swiggy and Zepto names and logos are trademarks of their respective owners,
        shown only to indicate platforms our riders work on. Vihaan Fleet is not affiliated with or endorsed by them.
      </p>
    </footer>
  );
}
