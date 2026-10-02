import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Bag, Menu, Close, User } from './Icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import brand, { formatPrice } from '../brand';

const links = [
  { to: '/loja', label: 'Loja toda' },
  { to: '/loja?categoria=coleiras', label: 'Coleiras' },
  { to: '/loja?categoria=bandanas', label: 'Bandanas' },
  { to: '/loja?categoria=presilhas', label: 'Presilhas' },
];

// Avatar button with a small menu (account pages, admin, sign out).
function AccountMenu({ user, isAdmin, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="account-menu" ref={ref}>
      <button
        type="button"
        className="account-btn"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu da conta (${user.name})`}
        title={user.name}
      >
        <Avatar user={user} size={46} />
      </button>
      {open && (
        <div className="account-menu__pop" role="menu">
          <div className="account-menu__who">
            <b>{user.name}</b>
            <small className="muted">{user.email}</small>
          </div>
          <Link to="/minha-conta" role="menuitem">Minha conta</Link>
          <Link to="/minha-conta/pets" role="menuitem">Meus pets</Link>
          <Link to="/minha-conta/pedidos" role="menuitem">Meus pedidos</Link>
          {isAdmin && <Link to="/admin" role="menuitem">Painel admin</Link>}
          <button type="button" role="menuitem" className="account-menu__out" onClick={signOut}>Sair da conta</button>
        </div>
      )}
    </div>
  );
}

// Scrolling promo bar. The list is repeated so the loop is seamless (the track moves by exactly half).
function Announce({ messages }) {
  const group = (hidden) => (
    <div className="announce__group" aria-hidden={hidden || undefined}>
      {[...messages, ...messages, ...messages].map((m, i) => (
        <span key={i} className="announce__item">{m}</span>
      ))}
    </div>
  );
  return (
    <div className="announce" role="region" aria-label="Promoções">
      <span className="sr-only">{messages.join('. ')}</span>
      <div className="announce__track" aria-hidden>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}

export default function Header() {
  const { count, missingForFree } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location]);

  // once the page scrolls, the bar tightens and lifts off the content
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <Announce
        messages={[
          missingForFree > 0 && count > 0 && `Faltam só ${formatPrice(missingForFree)} para o frete grátis!`,
          `Frete grátis acima de ${formatPrice(brand.shipping.freeFrom)}`,
          '5% off no Pix',
          'Troca fácil de tamanho em até 30 dias',
        ].filter(Boolean)}
      />
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
        {user ? (
          <AccountMenu user={user} isAdmin={isAdmin} logout={logout} />
        ) : (
          <Link to="/entrar" className="account-btn" aria-label="Entrar ou criar conta" title="Entrar">
            <User />
          </Link>
        )}
        <Link to="/carrinho" className="cart-btn" aria-label={`Carrinho, ${count} itens`}>
          <Bag />
          {count > 0 && <span className="cart-btn__count">{count}</span>}
        </Link>
      </div>
    </header>
  );
}
