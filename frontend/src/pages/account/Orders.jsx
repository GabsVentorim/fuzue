import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { formatPrice } from '../../brand';
import { ORDER_STATUS, PAYMENT, formatDate } from '../../labels';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myOrders().then(setOrders).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="alert">{error}</p>;
  if (!orders) return <p className="muted">Carregando…</p>;
  if (!orders.length)
    return (
      <div className="empty">
        <p>Você ainda não fez nenhum pedido.</p>
        <Link to="/loja" className="btn btn--primary">Ir para a loja</Link>
      </div>
    );

  return (
    <div className="stack">
      {orders.map((o) => (
        <Link key={o.id} to={`/pedido/${o.id}`} className="tile tile--row">
          <div>
            <strong>{o.id}</strong>
            <span className="muted small">{formatDate(o.createdAt)} · {PAYMENT[o.payment]}</span>
            <span className="small">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</span>
          </div>
          <div className="tile__end">
            <span className={`status status--${o.status}`}>{ORDER_STATUS[o.status]}</span>
            <span className="price">{formatPrice(o.total)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
