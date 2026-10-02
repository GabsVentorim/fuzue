// Shared Framer Motion presets, so every animated part of the store moves the same way.
export const ease = [0.16, 1, 0.3, 1]; // confident deceleration
export const spring = { type: 'spring', stiffness: 420, damping: 32 }; // snappy, no wobble
export const softSpring = { type: 'spring', stiffness: 260, damping: 28 };

export const page = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.16, ease: 'easeIn' } },
};

export const pop = {
  initial: { opacity: 0, scale: 0.9, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};
