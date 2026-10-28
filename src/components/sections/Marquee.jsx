/**
 * "Earn on" strip under the hero: official platform logos on cream tiles,
 * scrolling forever. Logo files live in public/brands/ (see the README note
 * there); `h` is the optical height so every mark looks the same size.
 */
const PLATFORMS = [
  { name: 'Uber', file: 'uber.svg', h: 24 },
  { name: 'Ola', file: 'ola.svg', h: 34 },
  { name: 'Rapido', file: 'rapido.svg', h: 32 },
  { name: 'Zomato', file: 'zomato.svg', h: 22 },
  { name: 'Swiggy', file: 'swiggy.svg', h: 32, label: true },
  { name: 'Zepto', file: 'zepto.svg', h: 26 },
];

function Tile({ p, hidden }) {
  return (
    <li className="plat-tile" aria-hidden={hidden || undefined}>
      <img src={`/brands/${p.file}`} alt={hidden ? '' : p.name} height={p.h} style={{ height: p.h }} loading="eager" />
      {p.label && (
        <span className="plat-name" aria-hidden="true">
          {p.name}
        </span>
      )}
    </li>
  );
}

export default function Marquee() {
  return (
    <section className="marquee" aria-label="Platforms our riders earn on">
      <p className="marquee-label">
        <span>Earn on</span>
      </p>
      <div className="marquee-window">
        <ul className="marquee-track">
          {[0, 1, 2].map((copy) =>
            PLATFORMS.map((p) => <Tile key={`${copy}-${p.name}`} p={p} hidden={copy > 0} />)
          )}
        </ul>
      </div>
    </section>
  );
}
