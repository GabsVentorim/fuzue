import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { formatPrice, whatsappLinkTo } from '../../brand';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../labels';
import { PetCard } from '../account/Pets';
import { OrdersTable } from './Dashboard';

function CustomerDetail({ id }) {
  const { user: me } = useAuth();
  const [c, setC] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.customer(id).then(setC).catch((e) => setError(e.message));
  }, [id]);

  const toggleAdmin = async () => {
    const role = c.role === 'admin' ? 'customer' : 'admin';
    const msg = role === 'admin' ? `Dar acesso de admin para ${c.name}?` : `Remover o acesso de admin de ${c.name}?`;
    if (!confirm(msg)) return;
    try {
      const u = await api.admin.setRole(c.id, role);
      setC({ ...c, role: u.role });
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <p className="alert">{error}</p>;
  if (!c) return <p className="muted">Carregando…</p>;

  const spent = c.orders.filter((o) => o.status !== 'cancelado').reduce((s, o) => s + o.total, 0);

  return (
    <div className="stack">
      <p className="crumbs"><Link to="/admin/clientes">Clientes</Link> / {c.name}</p>
      <div className="toolbar">
        <div>
          <h1 className="admin__h1">{c.name} {c.role === 'admin' && <span className="tag tag--blue">admin</span>}</h1>
          <p className="muted small">
            {c.email}{c.phone && ` · ${c.phone}`} · cliente desde {formatDate(c.createdAt)}{c.hasGoogle && ' · Google'}
          </p>
        </div>
        <div className="toolbar__right">
          {c.phone && <a className="btn btn--ghost btn--sm" target="_blank" rel="noreferrer" href={whatsappLinkTo(c.phone, `Oi, ${c.name.split(' ')[0]}!`)}>WhatsApp</a>}
          {me.id !== c.id && (
            <button className="btn btn--ghost btn--sm" onClick={toggleAdmin}>{c.role === 'admin' ? 'Remover admin' : 'Tornar admin'}</button>
          )}
        </div>
      </div>

      <div className="stats">
        <div className="stat"><span className="stat__label">Pedidos</span><strong className="stat__value">{c.orders.length}</strong></div>
        <div className="stat"><span className="stat__label">Total gasto</span><strong className="stat__value">{formatPrice(spent)}</strong></div>
        <div className="stat"><span className="stat__label">Pets</span><strong className="stat__value">{c.pets.length}</strong></div>
      </div>

      <div className="panel">
        <div className="panel__head"><h2>Pets</h2></div>
        {c.pets.length ? <div className="pets">{c.pets.map((p) => <PetCard key={p.id} pet={p} />)}</div> : <p className="muted small">Nenhum pet cadastrado.</p>}
      </div>

      <div className="panel">
        <div className="panel__head"><h2>Pedidos</h2></div>
        <OrdersTable orders={c.orders} />
      </div>

      <div className="panel">
        <div className="panel__head"><h2>Endereços</h2></div>
        {c.addresses.length === 0 && <p className="muted small">Nenhum endereço salvo.</p>}
        {c.addresses.map((a) => (
          <p key={a.id} className="small">
            {a.label && <b>{a.label}: </b>}{a.address}, {a.number}{a.complement ? ` — ${a.complement}` : ''} · {a.city}/{a.state} · CEP {a.cep}
            {a.isDefault && <span className="tag">padrão</span>}
          </p>
        ))}
      </div>
    </div>
  );
}

function CustomerList() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => api.admin.customers({ q }).then(setList).catch((e) => setError(e.message)), 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="stack">
      <div className="toolbar">
        <h1 className="admin__h1">Clientes</h1>
        <input className="input" type="search" placeholder="Buscar nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <p className="alert">{error}</p>}
      {!list ? (
        <p className="muted">Carregando…</p>
      ) : (
        <div className="panel table-wrap">
          <table className="table">
            <thead>
              <tr><th>Nome</th><th>E-mail</th><th>Desde</th><th className="num">Pets</th><th className="num">Pedidos</th><th className="num">Gasto</th></tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/admin/clientes/${c.id}`} className="link">{c.name}</Link>{c.role === 'admin' && <span className="tag tag--blue">admin</span>}</td>
                  <td>{c.email}</td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td className="num">{c.petCount}</td>
                  <td className="num">{c.orderCount}</td>
                  <td className="num">{formatPrice(c.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const { id } = useParams();
  return id ? <CustomerDetail id={id} /> : <CustomerList />;
}
