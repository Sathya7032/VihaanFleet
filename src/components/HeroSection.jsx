/**
 * Hero: two-line headline, CTAs, ₹299 price pill, gold road line and speed
 * streaks. `live` starts the entrance (after the intro hands over) - it is
 * timed with the 3D scooter's ride-in on the background stage.
 */
export default function HeroSection({ live }) {
  return (
    <section className={`hero ${live ? 'is-live' : ''}`} id="top">
      <div className="speed-lines" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>

      <div className="hero-copy">
        <p className="eyebrow">Hyderabad · Daily two-wheeler rentals</p>
        <h1 id="hero-title">
          <span className="line">
            <span>Ride to earn.</span>
          </span>
          <span className="line">
            <span className="gold-text">We provide the bike.</span>
          </span>
        </h1>
        <p className="hero-sub">
          Well-maintained, insured scooters and bikes for Uber, Ola, Rapido, Zomato, Swiggy and Zepto riders. No
          bike to buy. No lock-ins.
        </p>
        <div className="hero-cta">
          <a className="btn btn-gold" href="#pricing">
            View rental plan
          </a>
          <a className="btn btn-ghost" href="/contact">
            Talk to us
          </a>
        </div>
      </div>

      <div className="price-pill" aria-label="Daily rent ₹299">
        <span className="price-pill-label">Daily rent</span>
        <strong>₹299</strong>
        <small>/day</small>
      </div>

      <div className="road" aria-hidden="true" />
      <div className="scroll-cue" aria-hidden="true">
        <span />
        Scroll
      </div>
    </section>
  );
}
