import { useEffect, useRef } from 'react';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Writes how far the element has travelled through the viewport into a CSS variable, --p:
// 0 when its top reaches the bottom of the screen, 1 when its bottom leaves the top (or, for a
// tall "pinned" scene, 0 → 1 while it's being scrolled through). CSS turns --p into motion,
// so the animation is scrubbed by the scroll itself. With reduced motion --p stays at `rest`.
export default function useScrollProgress({ pinned = false, rest = 0.5 } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) return void el.style.setProperty('--p', rest);
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = pinned
        ? -r.top / Math.max(1, r.height - vh)
        : (vh - r.top) / (vh + r.height);
      el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pinned, rest]);
  return ref;
}
