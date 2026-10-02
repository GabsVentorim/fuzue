import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { Paw } from './Icons';

export default function Toast() {
  const { toast } = useCart();
  return (
    <div className="toast-slot" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            className="toast"
            initial={{ y: 90, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 90, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            <motion.span initial={{ rotate: -40, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 12 }}>
              <Paw width={20} height={20} />
            </motion.span>
            <span>{toast}</span>
            <Link to="/carrinho">Ver carrinho</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
