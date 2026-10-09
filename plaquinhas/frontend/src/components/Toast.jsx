import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { Paw, Alert } from './Icons';

export default function Toast() {
  const { toast } = useToast();
  return (
    <div className="toast-slot" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            className={`toast ${toast.tone === 'bad' ? 'toast--bad' : ''}`}
            initial={{ y: 90, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 90, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            <motion.span
              initial={{ rotate: -40, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 12 }}
            >
              {toast.tone === 'bad' ? <Alert width={20} height={20} /> : <Paw width={20} height={20} />}
            </motion.span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
