import { AnimatePresence, motion } from 'framer-motion';
import { softSpring } from '../motion';

// Product grid that rearranges itself: when the list changes (filter, search, sort) the cards that
// stay glide to their new places, new ones pop in and removed ones shrink away.
export default function MotionGrid({ items, render, className = '' }) {
  return (
    <motion.div layout className={`grid ${className}`}>
      <AnimatePresence mode="popLayout" initial>
        {items.map((it, i) => (
          <motion.div
            key={it.id}
            layout
            initial={{ opacity: 0, y: 26, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { ...softSpring, delay: Math.min(i, 8) * 0.045 } }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
            transition={softSpring}
          >
            {render(it, i)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
