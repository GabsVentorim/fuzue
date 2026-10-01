import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Visão geral', end: true },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/estoque', label: 'Estoque' },
  { to: '/admin/cupons', label: 'Cupons' },
  { to: '/admin/chamados', label: 'Chamados' },
  { to: '/admin/clientes', label: 'Clientes' },
];

export default function AdminLayout() {
  return (
    <section className="section container admin">
      <aside className="admin__nav">
        <p className="admin__title">Painel admin</p>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `admin__link ${isActive ? 'admin__link--on' : ''}`}>
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
