import { useRef, useState } from 'react';
import Sticker from './Sticker';
import useReveal from '../hooks/useReveal';

const LINE_KINDS = ['sparkle', 'squiggle', 'rainbow'];

// One sticker: slapped on when it scrolls into view, floats a little, peels up under the pointer,
// spins when clicked — and can be dragged anywhere (it stays where you drop it while you're on the page).
function Peel({ s, i, shown }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [spin, setSpin] = useState(0);
  const drag = useRef(null);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    // on touch screens a tap spins it, but dragging is left to page scrolling
    if (e.pointerType !== 'mouse') return void (drag.current = { touch: true });
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, x: pos.x, y: pos.y, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.touch) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    setPos({ x: d.x + dx, y: d.y + dy });
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) setSpin((n) => n + 1); // a click (not a drag) spins it
  };

  const place = {
    top: s.top, left: s.left, right: s.right, bottom: s.bottom,
    width: s.size, '--rot': `${s.rot || 0}deg`, '--i': i, '--float': `${4 + (i % 3)}s`,
    translate: `${pos.x}px ${pos.y}px`,
  };
  return (
    <span
      className={`sticker sticker--${s.kind} ${LINE_KINDS.includes(s.kind) ? 'sticker--line' : ''} ${s.hideMobile ? 'sticker--desk' : ''} ${shown ? 'is-in' : ''} ${drag.current?.moved ? 'is-dragging' : ''}`}
      style={place}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      aria-hidden
    >
      <span className="sticker__float">
        <span className="sticker__body" key={spin} data-spin={spin > 0 || undefined}>
          <Sticker kind={s.kind} color={s.color} faced={s.faced} wink={s.wink} />
        </span>
      </span>
    </span>
  );
}

// A layer of decorative stickers over a section (position: relative parent). Purely decorative:
// hidden from screen readers, and it never blocks the content (only the stickers themselves take the pointer).
export default function Stickers({ items }) {
  const [ref, shown] = useReveal({ threshold: 0.01 });
  return (
    <div className="stickers" ref={ref} aria-hidden>
      {items.map((s, i) => <Peel key={i} s={s} i={i} shown={shown} />)}
    </div>
  );
}
