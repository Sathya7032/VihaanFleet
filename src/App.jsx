import { Suspense, lazy, useCallback, useRef, useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Marquee from './components/sections/Marquee';
import ServicesSection from './components/sections/ServicesSection';
import PricingSection from './components/sections/PricingSection';
import RentalStepsSection from './components/RentalStepsSection';
import AppSection from './components/sections/AppSection';
import TestimonialsSection from './components/sections/TestimonialsSection';
import ContactSection from './components/sections/ContactSection';
import { CtaSection, FaqSection } from './components/sections/ClosingSections';
import EarningsSection from './components/sections/EarningsSection';
import Footer from './components/Footer';
import { ContactPage, LegalPage } from './pages/SubPages';
import BookBikePage from './pages/BookBikePage';
import IntroAnimation from './components/intro/IntroAnimation';
import { shouldPlayIntro } from './components/intro/introEnvironment';
import useScrollEffects from './hooks/useScrollEffects';

// three.js is only downloaded for the homepage, in its own chunk.
const ScooterStage = lazy(() => import('./components/stage/ScooterStage'));

/** Tiny path router: /, /book-bike, /contact, /privacy, /terms, /refund (".html" also accepted). */
function routeFromPath(pathname) {
  const p = pathname.replace(/\/+$/, '').replace(/\.html$/, '').replace(/^\/index$/, '') || '/';
  if (p === '/contact') return { page: 'contact' };
  if (p === '/book-bike') return { page: 'book' };
  if (p === '/privacy' || p === '/terms' || p === '/refund') return { page: 'legal', legal: p.slice(1) };
  return { page: 'home' };
}

function HomePage({ heroLive }) {
  useScrollEffects(true);
  return (
    <main id="main">
      <HeroSection live={heroLive} />
      <Marquee />
      <ServicesSection />
      <PricingSection />
      <RentalStepsSection />
      <AppSection />
      <TestimonialsSection />
      <EarningsSection />
      <FaqSection />
      <ContactSection />
      <CtaSection />
    </main>
  );
}

const App = () => {
  const [route] = useState(() => routeFromPath(window.location.pathname));
  const isHome = route.page === 'home';

  // Intro: decided once before first paint so the logo never flashes.
  const [introActive, setIntroActive] = useState(() => isHome && shouldPlayIntro());
  const [logoState, setLogoState] = useState(introActive ? 'hidden' : 'shown');
  // The hero (copy reveal + scooter ride-in) starts when the intro hands over.
  const [heroLive, setHeroLive] = useState(!introActive);
  const [stageFailed, setStageFailed] = useState(false);
  const logoIconRef = useRef(null);

  const handleHandoff = useCallback(() => {
    setLogoState('shown');
    setHeroLive(true);
  }, []);
  const handleStageError = useCallback(() => setStageFailed(true), []);

  return (
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>

      {isHome && !stageFailed && (
        <Suspense fallback={null}>
          <ScooterStage rideIn={heroLive} paused={!heroLive} onError={handleStageError} />
        </Suspense>
      )}

      <Navbar logoState={logoState} logoIconRef={logoIconRef} />

      {isHome && <HomePage heroLive={heroLive} />}
      {route.page === 'contact' && <ContactPage />}
      {route.page === 'book' && <BookBikePage />}
      {route.page === 'legal' && <LegalPage page={route.legal} />}

      <Footer />

      {introActive && (
        <IntroAnimation
          targetRef={logoIconRef}
          onHandoff={handleHandoff}
          onComplete={() => setIntroActive(false)}
        />
      )}
    </div>
  );
};

export default App;
