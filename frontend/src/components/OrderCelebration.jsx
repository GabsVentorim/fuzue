import { useEffect, useRef, useState } from 'react';

// Shown right after an order is placed: a circle fills with green water, then a check mark is drawn.
// Click (or any key) skips it. Calls onDone when it's over.
const FILL_MS = 1500; // water rising
const TOTAL_MS = 3200; // until the overlay starts fading out
const FADE_MS = 400;

// one period = 100 units, repeated so the wave can slide sideways forever
const wave = (y, amp) =>
  `M0 ${y} ` +
  Array.from({ length: 8 }, (_, i) => `q 25 ${i % 2 ? amp : -amp} 50 0`).join(' ') +
  ` V 420 H 0 Z`; // tall enough to keep the circle full once the water reaches the top

export default function OrderCelebration({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const finish = () => {
      setLeaving(true);
      setTimeout(() => done.current(), FADE_MS);
    };
    const t = setTimeout(finish, TOTAL_MS);
    const skip = () => {
      clearTimeout(t);
      finish();
    };
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  return (
    <div
      className={`celebrate ${leaving ? 'celebrate--out' : ''}`}
      role="status"
      aria-live="polite"
      onClick={() => {
        setLeaving(true);
        setTimeout(() => done.current(), FADE_MS);
      }}
    >
      <svg className="celebrate__badge" viewBox="0 0 200 200" aria-hidden>
        <defs>
          <clipPath id="celebrate-clip">
            <circle cx="100" cy="100" r="86" />
          </clipPath>
        </defs>
        <circle cx="100" cy="100" r="86" className="celebrate__bg" />
        <g clipPath="url(#celebrate-clip)">
          <g className="celebrate__rise" style={{ animationDuration: `${FILL_MS}ms` }}>
            <path className="celebrate__wave celebrate__wave--back" d={wave(100, 9)} />
            <path className="celebrate__wave celebrate__wave--front" d={wave(104, 7)} />
          </g>
        </g>
        <circle cx="100" cy="100" r="86" className="celebrate__ring" />
        <path className="celebrate__check" d="M62 102 L88 128 L140 74" style={{ animationDelay: `${FILL_MS - 100}ms` }} />
      </svg>
      <p className="celebrate__title">Compra realizada!</p>
      <p className="celebrate__sub">Recebemos seu pedido 💚</p>
    </div>
  );
}
