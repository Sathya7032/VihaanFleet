# Vihaan Fleet – site design & intro

The site follows the reference design: black & gold, Outfit + Inter, a
cream-and-gold 3D Vespa that rides into the hero and glides between sections
as you scroll, plus contact and legal pages.

## Run it

```bash
npm install      # no new packages since the last update (three + @react-three/fiber)
npm run dev
```

| URL | Shows |
| --- | --- |
| `/` | homepage (intro plays on every load) |
| `/?intro` / `/?nointro` | force / disable the intro |
| `/contact`, `/privacy`, `/terms`, `/refund` | sub-pages (`.html` also works) |

**Hosting note:** the sub-pages are client-side routes. Configure your host to
serve `index.html` for unknown paths ("SPA fallback"). `vite dev` and
`vite preview` already do this. On Cloudflare Workers, set
`not_found_handling = "single-page-application"`.

## Intro sequence (~5.6 s, `src/components/intro/introConfig.js`)

| Time (s) | Stage | What happens |
| --- | --- | --- |
| 0 – 1.5 | drive | Scooter rides in a straight line from the left-centre to the centre, wheels rolling, then brakes with a suspension bump |
| 1.85 – 3.0 | dismantle | Mirrors, handlebar, seat, trims, side panels, front shield, tail and wheels fly apart in order and dissolve into gold particles |
| → 3.4 | (form V) | Particles stream on curved, trailed paths into the shape of the "V" |
| 3.4 – 3.7 | mark | The solid V monogram (the real logo component) takes over from the particle V |
| 3.8 – 4.4 | word | "Vihaan Fleet" writes on; the lock-up re-centres |
| 4.65 – 5.35 | move | The V + wordmark fly and scale into the navbar logo slot (FLIP) |
| 5.0 – 5.35 | fade | The backdrop fades; the homepage hero starts (scooter rides in, copy reveals) |
| 5.39 | hand-off | Navbar logo shown + overlay logo removed in the same React commit |

Skip button, `Esc` or hiding the tab all skip it. Reduced motion means no
intro and no scroll animations. If 3D isn't ready within 3 s, the intro is
skipped. `PLAY_ONCE_PER_SESSION` switches it to once per tab.

## Where things live

```
src/utils/colors.js            palette: gold, theme, scooter, light (+ legacy groups)
src/theme/applyTheme.js        palette -> CSS variables + V favicon
src/styles/site.css            the whole site theme (ported from the reference)
src/components/brand/          V monogram (vMark.js = single source of the V shape) + BrandMark
src/components/Navbar.jsx      fixed glass header, mobile menu
src/components/HeroSection.jsx, RentalStepsSection.jsx, Footer.jsx
src/components/sections/       Marquee, Services, Pricing, App, Rent-to-own, FAQ, CTA
src/components/stage/          fixed background 3D scooter (scroll choreography)
src/three/                     Vespa loader/splitter, shared studio + motion, section poses
src/hooks/useScrollEffects.js  reveals, count-ups, route fill, phone parallax (no GSAP)
src/pages/SubPages.jsx         contact + legal pages; copy in src/content/sitePages.js
src/components/intro/          the intro (overlay, engine, particle V)
public/models/scooter.glb      the 3D model (89 KB)
```

## 3D model & licence

`public/models/scooter.glb` is the same model the reference site uses:
**"Vespa" by Jasmine Roberts via Poly Pizza, licensed CC BY 3.0**, recoloured.
The licence requires attribution, so the footer credit line must stay.

The file is a single mesh. `src/three/vespaModel.js` splits it at load into
12 real components (wheels, seat, mirrors, handlebar/headlight, trims, front
shield, left/right panels, tail) so the intro's dismantle is genuine.

## Not carried over from the reference

- Ride-in engine sound (synthesised audio on first tap). Easy to add if you want it.
- Lenis smooth scrolling. Native scrolling is used instead.
- `src/components/AvailableBikesSection.jsx` and `src/assets/hero.png` /
  `steps.png` are no longer used by the page; they were left in place.
