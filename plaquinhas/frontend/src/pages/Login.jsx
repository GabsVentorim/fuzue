import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Arrow } from '../components/Icons';
import brand from '../brand';

// Só a loja entra aqui. Não existe cadastro público: as contas nascem pelo script
// `npm run create-admin` no backend.
export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Já logado (abriu /entrar direto com sessão aberta): vai para onde queria ir.
  // Num efeito, e não durante o render, pelo mesmo motivo explicado em RequireAuth.
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section container">
      <div className="auth__card">
        <Link to="/" className="link small">
          ← Voltar ao início
        </Link>

        <div className="auth__head">
          <span className="auth__lock">
            <Lock />
          </span>
          <h1>Área do lojista</h1>
          <p className="muted small">Entre para gerenciar as plaquinhas da {brand.name}.</p>
        </div>

        {error && <p className="alert">{error}</p>}

        <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
          <label className="field">
            E-mail
            <input
              className="input"
              type="email"
              autoComplete="username"
              required
              placeholder="voce@fuzuepetstore.com.br"
              value={form.email}
              onChange={set('email')}
            />
          </label>
          <label className="field">
            Senha
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
            />
          </label>
          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar no painel'} {!busy && <Arrow width={20} height={20} />}
          </button>
        </form>

        <div className="divider">acesso restrito</div>
        <p className="muted small center" style={{ margin: 0 }}>
          Esqueceu a senha? Rode no servidor:
          <br />
          <code className="mono">npm run create-admin -- seu@email.com "nova-senha"</code>
        </p>
      </div>
    </section>
  );
}
