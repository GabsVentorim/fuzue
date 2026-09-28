import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Paw } from './Icons';

export default function Toast() {
  const { toast } = useCart();
  return (
    <div className={`toast ${toast ? 'toast--show' : ''}`} role="status" aria-live="polite">
      <Paw width={20} height={20} />
      <span>{toast}</span>
      <Link to="/carrinho">Ver carrinho</Link>
    </div>
  );
}
