import { AnimatePresence, motion } from 'framer-motion';
import brand, { formatPrice } from '../brand';
import { Truck } from './Icons';
import { softSpring, spring } from '../motion';

// How far the cart is from free shipping: a pill track with the little truck riding the tip of the fill.
// Reaching the goal fills it, swaps the message and pops a check on the truck.
export default function FreeShippingBar({ subtotal, missing }) {
  const goal = brand.shipping.freeFrom;
  const pct = Math.min(100, (subtotal / goal) * 100);
  const done = missing <= 0;

  return (
    <div className={`fship ${done ? 'fship--done' : ''}`} role="status" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={done ? 'done' : 'left'}
          className="fship__msg"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
        >
          {done ? (
            <><b>Frete grátis liberado!</b> Seu pedido viaja de graça.</>
          ) : (
            <>Faltam <b>{formatPrice(missing)}</b> para o <b>frete grátis</b></>
          )}
        </motion.p>
      </AnimatePresence>

      <div className="fship__track" aria-hidden>
        <motion.div className="fship__fill" initial={false} animate={{ width: `${pct}%` }} transition={softSpring}>
          <motion.span className="fship__truck" initial={false} animate={done ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={spring}>
            <Truck width={18} height={18} />
            {done && (
              <motion.span className="fship__check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.15 }}>✓</motion.span>
            )}
          </motion.span>
        </motion.div>
      </div>

      {!done && (
        <div className="fship__scale" aria-hidden>
          <span>{formatPrice(subtotal)}</span>
          <span>{formatPrice(goal)}</span>
        </div>
      )}
    </div>
  );
}
