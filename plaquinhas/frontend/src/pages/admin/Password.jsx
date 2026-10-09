import { useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Lock } from '../../components/Icons';

export default function Password() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();
  const { user } = useAuth();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirm) return setError('A confirmação não bate com a nova senha.');
    setSaving(true);
    try {
      await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      notify('Senha alterada');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <h1 className="admin__h1">Trocar senha</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Conta: <b>{user?.email}</b>
      </p>

      <form onSubmit={submit}>
        <fieldset className="box">
          <legend>
            <Lock width={18} height={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 6 }} />
            Nova senha
          </legend>

          <label className="field field--full">
            Senha atual
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={set('currentPassword')}
            />
          </label>

          <label className="field">
            Nova senha
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.newPassword}
              onChange={set('newPassword')}
            />
            <small className="muted">Pelo menos 8 caracteres.</small>
          </label>

          <label className="field">
            Confirme a nova senha
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={set('confirm')}
            />
          </label>

          {error && <p className="alert field--full">{error}</p>}

          <div className="row field--full">
            <button className="btn btn--primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Trocar senha'}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
