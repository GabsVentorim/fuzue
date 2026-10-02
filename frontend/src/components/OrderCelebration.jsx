import { useEffect, useRef, useState } from 'react';
import brand from '../brand';
import { imageUrl } from '../assets';
import Sticker from './Sticker';

// Right after checkout: the logo's blue ball drops in, bounces twice, then swells into the
// confirmation seal — a check mark draws itself and stickers burst out around it.
// The stickers fly over the top half and the sides, never over the text below.
// Click (or any key) skips it. Calls onDone when it's over; the order page opens with the same seal.
const TOTAL_MS = 2900;
const FADE_MS = 450;

const BURST = [
  { kind: 'star', color: '#f7b6d9' },
  { kind: 'heart', color: '#f2232a', faced: true },
  { kind: 'burst', color: '#f2b33d' },
  { kind: 'flower', color: '#1e9bea', faced: true },
  { kind: 'sparkle', color: '#ff2a0a' },
  { kind: 'triangle', color: '#9ecfd3', faced: true },
  { kind: 'star', color: '#5b6cf0' },
  { kind: 'flower', color: '#f7b6d9', faced: true, wink: true },
];

export default function OrderCelebration({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;
  const ball = brand.assets?.logoAnimated?.ball;

  useEffect(() => {
    let t2;
    const finish = () => {
      setLeaving(true);
      t2 = setTimeout(() => done.current(), FADE_MS);
    };
    const t = setTimeout(finish, TOTAL_MS);
    const skip = () => { clearTimeout(t); finish(); };
    window.addEventListener('keydown', skip, { once: true });
    return () => { clearTimeout(t); clearTimeout(t2); window.removeEventListener('keydown', skip); };
  }, []);

  return (
    <div
      className={`celebrate ${leaving ? 'celebrate--out' : ''}`}
      role="status"
      aria-live="polite"
      onClick={() => { setLeaving(true); setTimeout(() => done.current(), FADE_MS); }}
    >
      <div className="celebrate__stage" aria-hidden>
        {ball && <img src={imageUrl(ball)} alt="" className="celebrate__ball" />}
        <svg className="celebrate__seal" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="56" className="celebrate__disc" />
          <path d="M36 62 L53 78 L86 44" className="celebrate__check" pathLength="1" />
        </svg>
        {BURST.map((s, i) => (
          <span key={i} className="celebrate__bit" style={{ '--a': `${-195 + (210 / (BURST.length - 1)) * i}deg`, '--d': `clamp(110px, ${26 + (i % 3) * 6}vw, ${170 + (i % 3) * 50}px)`, '--i': i }}>
            <Sticker {...s} />
          </span>
        ))}
      </div>
      <p className="celebrate__title">Pedido confirmado!</p>
      <p className="celebrate__sub">Já estamos separando seus mimos</p>
    </div>
  );
}
