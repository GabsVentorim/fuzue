import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Visão geral', end: true },
  { to: '/admin/plaquinhas', label: 'Plaquinhas' },
  { to: '/admin/nova', label: 'Cadastrar' },
  { to: '/admin/senha', label: 'Trocar senha' },
];

export default function AdminLayout() {
  return (
    <section className="section container admin">
      <aside className="admin__nav">
        <p className="admin__title">Painel</p>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `admin__link ${isActive ? 'admin__link--on' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}
      </aside>
      <div className="admin__main">
        <Outlet />
      </div>
    </section>
  );
}
