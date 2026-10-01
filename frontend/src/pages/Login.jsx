import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleButton, { googleEnabled } from '../components/GoogleButton';

export default function Login() {
  const { user, login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/minha-conta';

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const run = async (fn) => {
    setSending(true);
    setError('');
    try {
      await fn();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => (mode === 'login' ? login(form) : register(form)));
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <section className="section container auth">
      <div className="auth__card">
        <h1 className="page-title center">Entrar ou criar conta</h1>
        <p className="muted center">
          Acompanhe pedidos, cadastre seus pets e compre mais rápido.
          {googleEnabled && ' Com o Google é um clique — na primeira vez, sua conta é criada na hora.'}
        </p>

        {googleEnabled ? (
          <GoogleButton onCredential={(credential) => run(() => loginWithGoogle(credential))} />
        ) : (
          import.meta.env.DEV && (
            <div className="google-placeholder">
              <button type="button" className="btn btn--ghost btn--block" disabled>Continuar com Google</button>
              <small className="muted">Falta configurar VITE_GOOGLE_CLIENT_ID (veja o README). Só você vê este aviso.</small>
            </div>
          )
        )}

        {(googleEnabled || import.meta.env.DEV) && <div className="divider"><span>ou use seu e-mail</span></div>}

        <form className="stack" onSubmit={submit}>
          {mode === 'register' && (
            <label className="field">Nome<input className="input" required autoComplete="name" value={form.name} onChange={set('name')} /></label>
          )}
          <label className="field">E-mail<input className="input" type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></label>
          <label className="field">
            Senha
            <input
              className="input"
              type="password"
              required
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={set('password')}
            />
            {mode === 'register' && <small className="muted">Mínimo de 8 caracteres.</small>}
          </label>
          {error && <p className="alert">{error}</p>}
          <button className="btn btn--primary btn--block" disabled={sending}>
            {sending ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="center small auth__switch">
          {mode === 'login' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
          <button type="button" className="link" onClick={switchMode}>
            {mode === 'login' ? 'Criar com e-mail' : 'Entrar'}
          </button>
        </p>
      </div>
    </section>
  );
}
