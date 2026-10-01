import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { formatPrice, whatsappLinkTo } from '../../brand';
import { ORDER_STATUS, SPECIES, formatDateTime } from '../../labels';

function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <strong className="stat__value">{value}</strong>
      {hint && <span className="stat__hint">{hint}</span>}
    </div>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.dashboard().then(setD).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="alert">{error}</p>;
  if (!d) return <p className="muted">Carregando…</p>;

  const pending = d.byStatus.aguardando_pagamento + d.byStatus.pago;
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="stack">
      <h1 className="admin__h1">Visão geral</h1>
      {d.openTickets > 0 && (
        <Link to="/admin/chamados" className="notice">
          📬 Você tem <b>{d.openTickets} chamado{d.openTickets > 1 ? 's' : ''}</b> esperando resposta (troca de CPF). <span className="link">Ver →</span>
        </Link>
      )}

      <div className="stats">
        <Stat label="Vendas hoje" value={formatPrice(d.today.revenue)} hint={`${d.today.orders} pedido${d.today.orders === 1 ? '' : 's'}`} />
        <Stat label={`Vendas em ${monthName}`} value={formatPrice(d.month.revenue)} hint={`${d.month.orders} pedidos`} />
        <Stat label="Ticket médio (mês)" value={formatPrice(d.month.avgTicket)} />
        <Stat label="Clientes" value={d.customers.total} hint={`+${d.customers.last30Days} nos últimos 30 dias`} />
      </div>

      <div className="admin-grid">
        <div className="panel">
          <div className="panel__head">
            <h2>Pedidos para cuidar</h2>
            <Link to="/admin/pedidos" className="link small">Ver todos →</Link>
          </div>
          <ul className="kv">
            {Object.entries(ORDER_STATUS).map(([k, label]) => (
              <li key={k}>
                <Link to={`/admin/pedidos?status=${k}`}><span className={`status status--${k}`}>{label}</span></Link>
                <b>{d.byStatus[k]}</b>
              </li>
            ))}
          </ul>
          {pending > 0 && <p className="small muted">{pending} pedido(s) aguardando pagamento ou envio.</p>}
        </div>

        <div className="panel">
          <div className="panel__head">
            <h2>Estoque baixo</h2>
            <Link to="/admin/estoque" className="link small">Estoque →</Link>
          </div>
          {d.lowStock.length === 0 ? (
            <p className="muted small">Tudo abastecido 🎉</p>
          ) : (
            <ul className="kv">
              {d.lowStock.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/produtos/${p.id}`}>{p.name}</Link>
                  <b className={p.stock === 0 ? 'text-danger' : 'text-warn'}>{p.stock === 0 ? 'esgotado' : `${p.stock} un.`}</b>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel__head"><h2>Mais vendidos (30 dias)</h2></div>
          {d.topProducts.length === 0 ? (
            <p className="muted small">Nenhuma venda ainda.</p>
          ) : (
            <ol className="kv kv--ol">
              {d.topProducts.map((p) => (
                <li key={p.productId}>
                  <span>{p.name}</span>
                  <b>{p.qty} un. · {formatPrice(p.revenue)}</b>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="panel">
          <div className="panel__head"><h2>🎂 Aniversariantes de {monthName}</h2></div>
          {d.petBirthdays.length === 0 ? (
            <p className="muted small">Nenhum pet faz aniversário este mês.</p>
          ) : (
            <ul className="kv">
              {d.petBirthdays.map((b) => (
                <li key={b.id}>
                  <span>
                    <b>{b.name}</b> <span className="muted small">({SPECIES[b.species].toLowerCase()}, dia {b.birthDate.slice(8, 10)}{b.estimated ? ' aprox.' : ''})</span>
                    <br />
                    <Link to={`/admin/clientes/${b.ownerId}`} className="small link">{b.ownerName}</Link>
                  </span>
                  {b.ownerPhone ? (
                    <a className="btn btn--ghost btn--xs" target="_blank" rel="noreferrer"
                      href={whatsappLinkTo(b.ownerPhone, `Oi, ${b.ownerName.split(' ')[0]}! Este mês é aniversário de ${b.name} 🎉`)}>
                      WhatsApp
                    </a>
                  ) : (
                    <a className="btn btn--ghost btn--xs" href={`mailto:${b.ownerEmail}`}>E-mail</a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel__head"><h2>Últimos pedidos</h2></div>
        <OrdersTable orders={d.recentOrders} />
      </div>
    </div>
  );
}

export function OrdersTable({ orders, onSelect }) {
  if (!orders.length) return <p className="muted small">Nenhum pedido.</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Status</th><th className="num">Total</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} onClick={onSelect && (() => onSelect(o))} className={onSelect ? 'clickable' : ''}>
              <td>{onSelect ? <b>{o.id}</b> : <Link to={`/admin/pedidos?id=${o.id}`} className="link">{o.id}</Link>}</td>
              <td>{formatDateTime(o.createdAt)}</td>
              <td>{o.customer.name}</td>
              <td><span className={`status status--${o.status}`}>{ORDER_STATUS[o.status]}</span></td>
              <td className="num">{formatPrice(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
