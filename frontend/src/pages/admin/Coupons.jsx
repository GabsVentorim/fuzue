import { useEffect, useState } from 'react';
import { api } from '../../api';
import { formatPrice } from '../../brand';
import { formatDate } from '../../labels';

const TYPES = {
  percent: 'Porcentagem (%)',
  fixed: 'Valor fixo (R$)',
  frete: 'Frete grátis',
};

const empty = { code: '', type: 'percent', value: '', minSubtotal: '', maxUses: '', oncePerCustomer: false, expiresAt: '', active: true };

const expired = (c) => c.expiresAt && new Date(c.expiresAt + 'T23:59:59') < new Date();
const soldOut = (c) => c.maxUses != null && c.uses >= c.maxUses;

function CouponForm({ coupon, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    coupon
      ? { ...empty, ...coupon, value: coupon.value || '', minSubtotal: coupon.minSubtotal || '', maxUses: coupon.maxUses ?? '', expiresAt: coupon.expiresAt || '' }
      : empty
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      onSaved(coupon ? await api.admin.updateCoupon(coupon.id, form) : await api.admin.createCoupon(form));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <fieldset className="box">
        <legend>{coupon ? `Editar ${coupon.code}` : 'Novo cupom'}</legend>
        <label className="field">
          Código
          <input className="input" required placeholder="EX.: BEMVINDO10" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })} />
          <small className="muted">É o que o cliente digita. Letras e números, sem espaço.</small>
        </label>
        <label className="field">
          Tipo
          <select className="input" value={form.type} onChange={set('type')}>
            {Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        {form.type !== 'frete' && (
          <label className="field">
            {form.type === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}
            <input className="input" required inputMode="decimal" placeholder={form.type === 'percent' ? 'ex.: 10' : 'ex.: 15,00'} value={form.value} onChange={set('value')} />
          </label>
        )}
        <label className="field">
          Compra mínima (R$)
          <input className="input" inputMode="decimal" placeholder="sem mínimo" value={form.minSubtotal} onChange={set('minSubtotal')} />
        </label>
        <label className="field">
          Limite de usos
          <input className="input" type="number" min={1} placeholder="ilimitado" value={form.maxUses} onChange={set('maxUses')} />
        </label>
        <label className="field">
          Válido até
          <input className="input" type="date" value={form.expiresAt} onChange={set('expiresAt')} />
          <small className="muted">Deixe vazio para não expirar.</small>
        </label>
        <div className="field field--full">
          <label className="check"><input type="checkbox" checked={form.oncePerCustomer} onChange={set('oncePerCustomer')} /> Cada CPF pode usar só 1 vez</label>
          <label className="check"><input type="checkbox" checked={form.active} onChange={set('active')} /> Ativo</label>
        </div>
        {error && <p className="alert field--full">{error}</p>}
        <div className="row field--full">
          <button className="btn btn--primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar cupom'}</button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        </div>
      </fieldset>
    </form>
  );
}

export default function Coupons() {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | coupon
  const [error, setError] = useState('');

  const load = () => api.admin.coupons().then(setList).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const toggle = async (c) => {
    await api.admin.updateCoupon(c.id, { ...c, active: !c.active });
    load();
  };
  const remove = async (c) => {
    if (!confirm(`Excluir o cupom ${c.code}?`)) return;
    await api.admin.deleteCoupon(c.id);
    load();
  };

  if (editing) {
    return (
      <div className="stack">
        <h1 className="admin__h1">Cupons</h1>
        <CouponForm coupon={editing === 'new' ? null : editing} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <h1 className="admin__h1">Cupons</h1>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing('new')}>+ Novo cupom</button>
      </div>
      {error && <p className="alert">{error}</p>}
      {!list ? (
        <p className="muted">Carregando…</p>
      ) : list.length === 0 ? (
        <div className="panel">
          <p className="muted">Nenhum cupom ainda. Crie o primeiro — ex.: <b>BEMVINDO10</b> com 10% para a primeira compra.</p>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table className="table">
            <thead>
              <tr><th>Código</th><th>Desconto</th><th>Regras</th><th className="num">Usos</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const status = !c.active ? 'Inativo' : expired(c) ? 'Expirado' : soldOut(c) ? 'Esgotado' : 'Ativo';
                return (
                  <tr key={c.id} className={status === 'Ativo' ? '' : 'row--muted'}>
                    <td><button className="link" onClick={() => setEditing(c)}><b>{c.code}</b></button></td>
                    <td>{c.label}</td>
                    <td className="small muted">
                      {[
                        c.minSubtotal > 0 && `mín. ${formatPrice(c.minSubtotal)}`,
                        c.oncePerCustomer && '1 por CPF',
                        c.expiresAt && `até ${formatDate(c.expiresAt)}`,
                      ].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="num">{c.uses}{c.maxUses != null && ` / ${c.maxUses}`}</td>
                    <td><span className={`status ${status === 'Ativo' ? 'status--entregue' : 'status--cancelado'}`}>{status}</span></td>
                    <td className="nowrap">
                      <button className="link small" onClick={() => toggle(c)}>{c.active ? 'Desativar' : 'Ativar'}</button>
                      {' · '}
                      <button className="link link--danger small" onClick={() => remove(c)}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
