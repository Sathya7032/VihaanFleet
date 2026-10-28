import { useEffect } from 'react';
import { pointOnRoute, readHowRoute, reachedStep } from '../three/howRoute';

// .phones is revealed as a whole: the phones themselves use `translate` for parallax.
const REVEAL_SELECTOR = '.panel-body > *:not(.cards):not(.app-copy), .card, .steps li, .stats div, .price-card, .app-copy > *';
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function countUp(el) {
  const target = Number(el.dataset.count);
  const duration = Number(el.dataset.duration || 1400);
  const start = performance.now();
  const step = (now) => {
    const t = clamp01((now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(target * eased));
    if (t < 1) el._raf = requestAnimationFrame(step);
  };
  el.textContent = '0';
  el._raf = requestAnimationFrame(step);
}

/**
 * Homepage scroll effects (the reference site used GSAP; this is a small
 * dependency-free equivalent):
 *  - fade/slide-up reveal of panel content, cards, steps, stats, phones
 *  - count-up numbers ([data-count])
 *  - "How it works" gold route line filling with scroll
 *  - phone mock-up parallax ([data-parallax])
 */
export default function useScrollEffects(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const isReduced = reduced();
    const cleanups = [];

    // Reveal + counters
    const revealEls = [...document.querySelectorAll(REVEAL_SELECTOR)];
    const counters = [...document.querySelectorAll('[data-count]')];
    if (!isReduced && 'IntersectionObserver' in window) {
      revealEls.forEach((el) => el.classList.add('reveal'));
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            if (e.target.dataset.count !== undefined) countUp(e.target);
            else e.target.classList.add('is-in');
            io.unobserve(e.target);
          });
        },
        { rootMargin: '0px 0px -12% 0px' }
      );
      revealEls.forEach((el) => io.observe(el));
      counters.forEach((el) => io.observe(el));
      cleanups.push(() => {
        io.disconnect();
        revealEls.forEach((el) => el.classList.remove('reveal', 'is-in'));
        counters.forEach((el) => {
          cancelAnimationFrame(el._raf);
          el.textContent = el.dataset.count;
        });
      });
    }

    // Scrubbed effects
    const route = document.getElementById('route');
    const fill = document.getElementById('route-fill');
    const app = document.getElementById('app');
    const phones = [...document.querySelectorAll('[data-parallax]')];
    const steps = [...document.querySelectorAll('#how .steps li')];
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      // "How it works": gold line fills up to the scooter; passed steps light up
      const how = readHowRoute();
      if (how && how.circles.length > 1) {
        const p = isReduced ? 1 : how.p;
        if (route && fill) {
          const lr = route.querySelector('.route-line').getBoundingClientRect();
          const at = pointOnRoute(how.circles, p);
          fill.style.transform = `scaleX(${clamp01((at.x - lr.left) / Math.max(lr.width, 1))})`;
        }
        const reached = p > 0 || how.approach >= 1 ? reachedStep(how.circles, p) : -1;
        steps.forEach((li, i) => li.classList.toggle('is-reached', i <= reached));
      }
      if (app && !isReduced) {
        const r = app.getBoundingClientRect();
        const p = clamp01((vh - r.top) / (vh + r.height));
        phones.forEach((el) => {
          el.style.translate = `0 ${Number(el.dataset.parallax) * p}px`;
        });
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    cleanups.push(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });

    return () => cleanups.forEach((fn) => fn());
  }, [enabled]);
}
