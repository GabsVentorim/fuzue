import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { Bag, Menu, Close, User } from './Icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import brand, { formatPrice } from '../brand';

const links = [
  { to: '/loja', label: 'Loja toda' },
  { to: '/loja?categoria=coleiras', label: 'Coleiras' },
  { to: '/loja?categoria=bandanas', label: 'Bandanas' },
  { to: '/loja?categoria=presilhas', label: 'Presilhas' },
];

export default function Header() {
  const { count, missingForFree } = useCart();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location]);

  return (
    <header className="header">
      <div className="announce">
        {missingForFree > 0 && count > 0
          ? `Faltam só ${formatPrice(missingForFree)} para o frete grátis!`
          : `Frete grátis acima de ${formatPrice(brand.shipping.freeFrom)} · 5% off no Pix`}
      </div>
      <div className="header__bar container">
        <button className="icon-btn header__menu" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <Close /> : <Menu />}
        </button>
        <Link to="/" className="header__logo" aria-label="Página inicial">
          <Logo />
        </Link>
        <nav className={`nav ${open ? 'nav--open' : ''}`}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="nav__link">
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className="nav__link nav__link--admin">Admin</NavLink>
          )}
        </nav>
        <Link
          to={user ? '/minha-conta' : '/entrar'}
          className="account-btn"
          aria-label={user ? `Minha conta (${user.name})` : 'Entrar ou criar conta'}
          title={user ? user.name : 'Entrar'}
        >
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : <User />}
        </Link>
        <Link to="/carrinho" className="cart-btn" aria-label={`Carrinho, ${count} itens`}>
          <Bag />
          {count > 0 && <span className="cart-btn__count">{count}</span>}
        </Link>
      </div>
    </header>
  );
}
