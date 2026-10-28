import { useId } from 'react';
import colors from '../../utils/colors';
import { vPath } from './vMark';

/**
 * Gold "V" monogram on a dark tile. Used by the navbar, the footer and the
 * intro overlay, so the logo that flies into the navbar is pixel-identical to
 * the one that receives it.
 */
export function VMark({ size = 40, className = '', style }) {
  const gid = `vgold-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className={`vmark ${className}`}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      style={style}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors.gold.light} />
          <stop offset="0.55" stopColor={colors.gold.base} />
          <stop offset="1" stopColor={colors.gold.deep} />
        </linearGradient>
      </defs>
      <rect className="vmark-tile" x="0.5" y="0.5" width="39" height="39" rx="10" />
      <path className="vmark-v" d={vPath} fill={`url(#${gid})`} />
    </svg>
  );
}

/**
 * The full brand lock-up: V monogram + "Vihaan Fleet".
 * `markRef` points at the V tile (used to measure the intro hand-off).
 * `state`: 'shown' | 'hidden' (hidden keeps its space: no layout shift).
 */
export default function BrandMark({ state = 'shown', markRef, as: Tag = 'span', className = '' }) {
  return (
    <Tag className={`brand-lockup ${state === 'hidden' ? 'is-hidden' : ''} ${className}`}>
      <span ref={markRef} className="brand-mark">
        <VMark />
      </span>
      <span className="brand-word">
        Vihaan <span className="gold-text">Fleet</span>
      </span>
    </Tag>
  );
}
