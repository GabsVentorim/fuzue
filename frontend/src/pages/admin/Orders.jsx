import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { formatPrice, whatsappLinkTo } from '../../brand';
import { ORDER_STATUS, PAYMENT, formatDateTime } from '../../labels';
import { OrdersTable } from './Dashboard';

function OrderDetail({ order, onChange, onClose }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const c = order.customer;

  const setStatus = async (status) => {
    if (status === order.status) return;
    if (status === 'cancelado' && !confirm('Cancelar o pedido? Os itens voltam para o estoque.')) return;
    setSaving(true);
    setError('');
    try {
      onChange(await api.admin.updateOrder(order.id, { status }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel order-detail">
      <div className="panel__head">
        <h2>{order.id}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">✕</button>
      </div>
      <p className="muted small">{formatDateTime(order.createdAt)} · {PAYMENT[order.payment]}</p>

      <label className="field">
        Status
        <select className="input" value={order.status} disabled={saving || order.status === 'cancelado'} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(ORDER_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      {error && <p className="alert">{error}</p>}

      <h3>Cliente</h3>
      <p className="small">
        <b>{c.name}</b>
        {order.userId && <> · <Link to={`/admin/clientes/${order.userId}`} className="link">ver cadastro</Link></>}
        <br />{c.email} · {c.phone}
        <br />{c.address}, {c.number}{c.complement ? ` — ${c.complement}` : ''}
        <br />{c.city}/{c.state} · CEP {c.cep}
      </p>
      <a className="btn btn--ghost btn--xs" target="_blank" rel="noreferrer" href={whatsappLinkTo(c.phone, `Oi, ${c.name.split(' ')[0]}! Sobre o seu pedido ${order.id}…`)}>
        Chamar no WhatsApp
      </a>

      <h3>Itens</h3>
      {order.items.map((i, idx) => (
        <div key={idx} className="summary__row small">
          <span>{i.qty}× {i.name}{i.size ? ` (${i.size})` : ''}{i.color ? ` · ${i.color}` : ''}</span>
          <span>{formatPrice(i.total)}</span>
        </div>
      ))}
      <div className="summary__row small">
        <span>Frete{order.shippingInfo ? ` · ${order.shippingInfo.name}${order.shippingInfo.company && order.shippingInfo.company.toLowerCase() !== order.shippingInfo.name.toLowerCase() ? ` (${order.shippingInfo.company})` : ''}` : ''}</span>
        <span>{order.shipping ? formatPrice(order.shipping) : 'Grátis'}</span>
      </div>
      {order.discount > 0 && <div className="summary__row small good"><span>Desconto</span><span>−{formatPrice(order.discount)}</span></div>}
      <div className="summary__row summary__total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
    </div>
  );
}

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const selectedId = params.get('id');
  const [q, setQ] = useState('');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api.admin.orders({ status, q }).then(setOrders).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [status, q]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const selected = orders?.find((o) => o.id === selectedId);
  const updated = (o) => setOrders((list) => list.map((x) => (x.id === o.id ? o : x)));

  return (
    <div className="stack">
      <h1 className="admin__h1">Pedidos</h1>
      <div className="toolbar">
        <div className="chips">
          <button className={`chip ${!status ? 'chip--on' : ''}`} onClick={() => setParam('status', '')}>Todos</button>
          {Object.entries(ORDER_STATUS).map(([k, l]) => (
            <button key={k} className={`chip ${status === k ? 'chip--on' : ''}`} onClick={() => setParam('status', k)}>{l}</button>
          ))}
        </div>
        <input className="input" type="search" placeholder="Buscar nº, nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <p className="alert">{error}</p>}
      {!orders ? (
        <p className="muted">Carregando…</p>
      ) : (
        <div className={selected ? 'split' : ''}>
          <div className="panel"><OrdersTable orders={orders} onSelect={(o) => setParam('id', o.id)} /></div>
          {selected && <OrderDetail key={selected.id} order={selected} onChange={updated} onClose={() => setParam('id', '')} />}
        </div>
      )}
    </div>
  );
}
