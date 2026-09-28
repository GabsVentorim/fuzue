import { useEffect, useState } from 'react';
import { api } from '../../api';
import { lookupCep } from '../../cep';

const empty = { label: '', cep: '', address: '', number: '', complement: '', city: '', state: '', isDefault: false };

export default function Addresses() {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | address id
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  useEffect(() => {
    api.addresses().then(setList).catch((e) => setError(e.message));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const open = (a) => {
    setError('');
    setEditing(a ? a.id : 'new');
    setForm(a ? { ...empty, ...a } : empty);
  };
  const fillFromCep = async () => {
    const r = await lookupCep(form.cep);
    if (r) setForm((f) => ({ ...f, address: r.address || f.address, city: r.city, state: r.state }));
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      setList(editing === 'new' ? await api.addAddress(form) : await api.updateAddress(editing, form));
      setEditing(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (a) => {
    if (!confirm('Remover este endereço?')) return;
    setList(await api.deleteAddress(a.id));
  };

  if (!list) return error ? <p className="alert">{error}</p> : <p className="muted">Carregando…</p>;

  return (
    <div className="stack">
      {list.length === 0 && editing === null && <p className="muted">Nenhum endereço salvo ainda.</p>}
      <div className="tiles">
        {list.map((a) => (
          <div key={a.id} className="tile">
            <strong>{a.label || 'Endereço'} {a.isDefault && <span className="tag">padrão</span>}</strong>
            <span>{a.address}, {a.number}{a.complement ? ` — ${a.complement}` : ''}</span>
            <span className="muted">{a.city}/{a.state} · CEP {a.cep}</span>
            <div className="row">
              <button className="link" onClick={() => open(a)}>Editar</button>
              <button className="link link--danger" onClick={() => remove(a)}>Remover</button>
            </div>
          </div>
        ))}
      </div>

      {editing === null ? (
        <div><button className="btn btn--primary" onClick={() => open(null)}>+ Novo endereço</button></div>
      ) : (
        <form onSubmit={save}>
          <fieldset className="box">
            <legend>{editing === 'new' ? 'Novo endereço' : 'Editar endereço'}</legend>
            <label className="field">Apelido<input className="input" placeholder="Casa, trabalho…" value={form.label} onChange={set('label')} /></label>
            <label className="field">CEP<input className="input" required placeholder="00000-000" value={form.cep} onChange={set('cep')} onBlur={fillFromCep} /></label>
            <label className="field field--full">Rua<input className="input" required value={form.address} onChange={set('address')} /></label>
            <label className="field">Número<input className="input" required value={form.number} onChange={set('number')} /></label>
            <label className="field">Complemento<input className="input" value={form.complement} onChange={set('complement')} /></label>
            <label className="field">Cidade<input className="input" required value={form.city} onChange={set('city')} /></label>
            <label className="field">Estado<input className="input" required maxLength={2} value={form.state} onChange={set('state')} /></label>
            <label className="check field--full"><input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} /> Usar como endereço padrão</label>
            {error && <p className="alert field--full">{error}</p>}
            <div className="row field--full">
              <button className="btn btn--primary">Salvar</button>
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
