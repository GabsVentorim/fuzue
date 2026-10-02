import { useEffect, useRef, useState } from 'react';

// Returns [ref, shown]: `shown` turns true the first time the element scrolls into view, and the
// component adds `is-in` to its className from it (as state, so re-renders never drop the class).
// Content is visible by default: the hidden "before" state only applies under html.motion-ok
// (set in main.jsx when motion is allowed), so a failed script or reduced motion never hides anything.
export default function useReveal({ threshold = 0.15 } = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    if (!('IntersectionObserver' in window)) return setShown(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, shown]);
  return [ref, shown];
}
