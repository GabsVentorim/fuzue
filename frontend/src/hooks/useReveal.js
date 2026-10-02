import { useEffect, useRef } from 'react';

// Adds `is-in` to the element the first time it scrolls into view. Content is visible by default:
// the hidden "before" state only applies under html.motion-ok (set in main.jsx when motion is allowed),
// so a failed script or reduced motion never hides anything.
export default function useReveal({ threshold = 0.15 } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return el?.classList.add('is-in');
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add('is-in');
        io.disconnect();
      }
    }, { threshold, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}
