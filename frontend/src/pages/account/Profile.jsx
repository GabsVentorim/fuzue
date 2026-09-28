import { useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../labels';
import Avatar from '../../components/Avatar';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone });
  const [pw, setPw] = useState({ current: '', password: '' });
  const [msg, setMsg] = useState({});

  const save = async (e) => {
    e.preventDefault();
    try {
      setUser(await api.updateProfile(form));
      setMsg({ profile: 'Dados salvos!' });
    } catch (err) {
      setMsg({ profileError: err.message });
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await api.changePassword(pw);
      setPw({ current: '', password: '' });
      setUser({ ...user, hasPassword: true });
      setMsg({ password: 'Senha atualizada!' });
    } catch (err) {
      setMsg({ passwordError: err.message });
    }
  };

  const changePhoto = async (file) => {
    if (!file) return;
    setMsg({ photoBusy: true });
    try {
      setUser(await api.uploadAvatar(file));
      setMsg({ photo: 'Foto atualizada!' });
    } catch (err) {
      setMsg({ photoError: err.message });
    }
  };

  const removePhoto = async () => {
    if (!confirm('Remover sua foto de perfil?')) return;
    try {
      setUser(await api.removeAvatar());
      setMsg({});
    } catch (err) {
      setMsg({ photoError: err.message });
    }
  };

  return (
    <div className="account-grid">
      <div className="box profile-photo">
        <Avatar user={user} size={112} />
        <div className="stack stack--tight">
          <label className="btn btn--ghost btn--sm">
            {msg.photoBusy ? 'Enviando…' : user.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={msg.photoBusy}
              onChange={(e) => { changePhoto(e.target.files[0]); e.target.value = ''; }} />
          </label>
          {user.avatarUrl && <button type="button" className="link link--danger" onClick={removePhoto}>Remover foto</button>}
          <small className="muted">JPG, PNG ou WEBP até 5 MB.</small>
          {msg.photo && <p className="good">{msg.photo}</p>}
          {msg.photoError && <p className="alert">{msg.photoError}</p>}
        </div>
      </div>
      <form onSubmit={save}>
        <fieldset className="box">
          <legend>Seus dados</legend>
          <label className="field field--full">Nome<input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field">E-mail<input className="input" value={user.email} disabled /></label>
          <label className="field">WhatsApp<input className="input" type="tel" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <p className="muted small field--full">
            Cliente desde {formatDate(user.createdAt)}
            {user.hasGoogle && ' · conta vinculada ao Google'}
          </p>
          {msg.profile && <p className="good field--full">{msg.profile}</p>}
          {msg.profileError && <p className="alert field--full">{msg.profileError}</p>}
          <div className="field--full"><button className="btn btn--primary">Salvar</button></div>
        </fieldset>
      </form>

      <form onSubmit={savePassword}>
        <fieldset className="box">
          <legend>{user.hasPassword ? 'Trocar senha' : 'Criar senha'}</legend>
          {!user.hasPassword && (
            <p className="muted small field--full">Você entra com o Google. Crie uma senha se quiser entrar também com e-mail.</p>
          )}
          {user.hasPassword && (
            <label className="field field--full">Senha atual<input className="input" type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
          )}
          <label className="field field--full">Nova senha<input className="input" type="password" required minLength={8} autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></label>
          {msg.password && <p className="good field--full">{msg.password}</p>}
          {msg.passwordError && <p className="alert field--full">{msg.passwordError}</p>}
          <div className="field--full"><button className="btn btn--ghost">Salvar senha</button></div>
        </fieldset>
      </form>
    </div>
  );
}
