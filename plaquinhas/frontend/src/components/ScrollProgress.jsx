import { motion, useScroll, useSpring } from 'framer-motion';

// Uma linha fina no topo: o quanto da página você já desceu.
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden />;
}
