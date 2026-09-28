import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { to: '/minha-conta', label: 'Meus dados', end: true },
  { to: '/minha-conta/pets', label: 'Meus pets' },
  { to: '/minha-conta/pedidos', label: 'Pedidos' },
  { to: '/minha-conta/enderecos', label: 'Endereços' },
];

export default function AccountLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="section container">
      <div className="account__head">
        <div>
          <h1 className="page-title">Oi, {user.name.split(' ')[0]}!</h1>
          <p className="muted">{user.email}</p>
        </div>
        <div className="row">
          {isAdmin && <NavLink to="/admin" className="btn btn--ghost btn--sm">Painel admin</NavLink>}
          <button className="btn btn--ghost btn--sm" onClick={() => logout().then(() => navigate('/'))}>Sair</button>
        </div>
      </div>
      <nav className="tabs">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tab ${isActive ? 'tab--on' : ''}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </section>
  );
}
