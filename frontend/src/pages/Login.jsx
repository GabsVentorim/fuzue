import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleButton, { googleEnabled } from '../components/GoogleButton';
import brand from '../brand';

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

  return (
    <section className="section container auth">
      <div className="auth__card">
        <h1 className="page-title center">{mode === 'login' ? 'Que bom te ver!' : 'Crie sua conta'}</h1>
        <p className="muted center">
          {mode === 'login'
            ? `Entre para acompanhar pedidos e cuidar dos seus pets na ${brand.name}.`
            : 'Cadastre seus pets e compre mais rápido da próxima vez.'}
        </p>

        <div className="tabs tabs--center" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={`tab ${mode === 'login' ? 'tab--on' : ''}`} onClick={() => setMode('login')}>
            Entrar
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={`tab ${mode === 'register' ? 'tab--on' : ''}`} onClick={() => setMode('register')}>
            Criar conta
          </button>
        </div>

        {googleEnabled && (
          <>
            <GoogleButton
              text={mode === 'login' ? 'signin_with' : 'signup_with'}
              onCredential={(credential) => run(() => loginWithGoogle(credential))}
            />
            <div className="divider"><span>ou com e-mail</span></div>
          </>
        )}

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
      </div>
    </section>
  );
}
