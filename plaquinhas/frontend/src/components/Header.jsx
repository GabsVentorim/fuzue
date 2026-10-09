import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Avatar from './Avatar';
import { Menu, Close, User } from './Icons';
import { useAuth } from '../context/AuthContext';

// O site público é só a home e a ficha da plaquinha, então a navegação é curta de propósito:
// quem chega aqui chegou escaneando uma medalha, não navegando pelo menu.
const links = [{ to: '/', label: 'Início', end: true }];

// Botão de avatar com um menu pequeno (painel, trocar senha, sair).
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
          {isAdmin && <Link to="/admin" role="menuitem">Painel das plaquinhas</Link>}
          {isAdmin && <Link to="/admin/nova" role="menuitem">Cadastrar plaquinha</Link>}
          <Link to="/admin/senha" role="menuitem">Trocar senha</Link>
          <button type="button" role="menuitem" className="account-menu__out" onClick={signOut}>
            Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // o menu do celular fecha ao trocar de página; depende do caminho, não do objeto,
  // que o roteador pode recriar a cada render
  useEffect(() => setOpen(false), [location.pathname]);

  // depois que a página rola, a barra se destaca do conteúdo
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__bar container">
        <button className="icon-btn header__menu" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <Close /> : <Menu />}
        </button>
        <Link to="/" className="header__logo" aria-label="Página inicial">
          <Logo />
        </Link>
        <nav className={`nav ${open ? 'nav--open' : ''}`}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav__link">
              {l.label}
            </NavLink>
          ))}
          {isAdmin && <NavLink to="/admin" className="nav__link nav__link--admin">Painel</NavLink>}
        </nav>
        {user ? (
          <AccountMenu user={user} isAdmin={isAdmin} logout={logout} />
        ) : (
          <Link to="/entrar" className="account-btn" aria-label="Área do lojista" title="Área do lojista">
            <User />
          </Link>
        )}
      </div>
    </header>
  );
}
