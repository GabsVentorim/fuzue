import { useEffect, useState } from 'react';
import { api } from '../../api';
import { imageUrl } from '../../assets';
import { formatDate } from '../../labels';
import HeroCarousel from '../../components/HeroCarousel';

const empty = { title: '', subtitle: '', buttonLabel: '', linkUrl: '', image: '', imageMobile: '', startsAt: '', endsAt: '', active: true };
const LINKS = [
  ['/loja', 'Loja toda'],
  ['/loja?categoria=coleiras', 'Coleiras'],
  ['/loja?categoria=bandanas', 'Bandanas'],
  ['/loja?categoria=presilhas', 'Presilhas'],
  ['/guia-de-tamanhos', 'Guia de tamanhos'],
];

const today = () => new Date().toISOString().slice(0, 10);
const statusOf = (b) =>
  !b.active ? ['Inativo', 'status--cancelado']
    : b.startsAt && b.startsAt > today() ? [`Agendado para ${formatDate(b.startsAt)}`, 'status--aguardando_pagamento']
    : b.endsAt && b.endsAt < today() ? ['Encerrado', 'status--cancelado']
    : ['No ar', 'status--entregue'];

function ImageField({ label, hint, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange((await api.admin.uploadBannerImage(file)).url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="field">
      <span>{label}</span>
      <div className="banner-upload">
        {value ? <img src={imageUrl(value)} alt="" /> : <span className="muted small">Sem imagem</span>}
      </div>
      <div className="row">
        <label className="btn btn--ghost btn--sm">
          {busy ? 'Enviando…' : value ? 'Trocar imagem' : 'Enviar imagem'}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }} />
        </label>
        {value && <button type="button" className="link link--danger small" onClick={() => onChange('')}>remover</button>}
      </div>
      <small className="muted">{hint}</small>
      {error && <p className="alert small">{error}</p>}
    </div>
  );
}

function BannerForm({ banner, onSaved, onCancel }) {
  const [form, setForm] = useState(() => (banner ? { ...empty, ...banner, imageMobile: banner.imageMobile || '', startsAt: banner.startsAt || '', endsAt: banner.endsAt || '' } : empty));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      onSaved(banner ? await api.admin.updateBanner(banner.id, form) : await api.admin.createBanner(form));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <fieldset className="box">
        <legend>Imagens</legend>
        <ImageField label="Imagem (computador) *" hint="Recomendado 1920 × 720 px (formato largo, ocupa a tela de lado a lado). JPG, PNG ou WEBP até 5 MB." value={form.image} onChange={(image) => setForm((f) => ({ ...f, image }))} />
        <ImageField label="Imagem para celular (opcional)" hint="Recomendado 900 × 1100 px (em pé). Sem ela, o celular usa a imagem do computador." value={form.imageMobile} onChange={(imageMobile) => setForm((f) => ({ ...f, imageMobile }))} />
      </fieldset>

      <fieldset className="box">
        <legend>Texto e link (tudo opcional)</legend>
        <label className="field">Título<input className="input" maxLength={80} placeholder="Ex.: Coleção Verão" value={form.title} onChange={set('title')} /></label>
        <label className="field">Texto do botão<input className="input" maxLength={30} placeholder="Ex.: Ver coleção" value={form.buttonLabel} onChange={set('buttonLabel')} /></label>
        <label className="field field--full">Subtítulo<input className="input" maxLength={160} placeholder="Ex.: Cores novas para os passeios de verão" value={form.subtitle} onChange={set('subtitle')} /></label>
        <label className="field field--full">
          Link ao clicar
          <input className="input" list="banner-links" placeholder="/loja?categoria=coleiras  ou  https://…" value={form.linkUrl} onChange={set('linkUrl')} />
          <datalist id="banner-links">{LINKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</datalist>
          <small className="muted">Páginas do site começam com “/”. Dica: abra um produto ou categoria e copie o final do endereço.</small>
        </label>
        <p className="muted small field--full">Se a sua imagem já tiver o texto escrito nela, deixe título, subtítulo e botão em branco.</p>
      </fieldset>

      <fieldset className="box">
        <legend>Quando mostrar</legend>
        <label className="field">Começa em<input className="input" type="date" value={form.startsAt} onChange={set('startsAt')} /></label>
        <label className="field">Termina em<input className="input" type="date" value={form.endsAt} onChange={set('endsAt')} /></label>
        <label className="check field--full"><input type="checkbox" checked={form.active} onChange={set('active')} /> Ativo</label>
        <p className="muted small field--full">Deixe as datas vazias para ficar no ar até você desativar — útil para agendar coleções futuras.</p>
      </fieldset>

      {form.image && (
        <div className="panel">
          <div className="panel__head"><h2>Prévia</h2></div>
          <HeroCarousel banners={[{ ...form, id: 'preview', linkUrl: '' }]} />
        </div>
      )}

      {error && <p className="alert">{error}</p>}
      <div className="row">
        <button className="btn btn--primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar banner'}</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

export default function Banners() {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | banner
  const [error, setError] = useState('');

  const load = () => api.admin.banners().then(setList).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const move = async (i, dir) => {
    const ids = list.map((b) => b.id);
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    setList(await api.admin.reorderBanners(ids));
  };
  const toggle = async (b) => {
    await api.admin.updateBanner(b.id, { ...b, active: !b.active });
    load();
  };
  const remove = async (b) => {
    if (!confirm(`Excluir o banner${b.title ? ` “${b.title}”` : ''}?`)) return;
    await api.admin.deleteBanner(b.id);
    load();
  };

  if (editing) {
    return (
      <div className="stack">
        <h1 className="admin__h1">{editing === 'new' ? 'Novo banner' : 'Editar banner'}</h1>
        <BannerForm banner={editing === 'new' ? null : editing} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <h1 className="admin__h1">Carrossel da home</h1>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing('new')}>+ Novo banner</button>
      </div>
      <p className="muted small">Novidades, coleções e campanhas que passam no topo da página inicial. Enquanto não houver nenhum banner no ar, a home mostra o destaque padrão.</p>
      {error && <p className="alert">{error}</p>}
      {!list ? (
        <p className="muted">Carregando…</p>
      ) : list.length === 0 ? (
        <div className="panel"><p className="muted">Nenhum banner ainda. Clique em “+ Novo banner” para criar o primeiro.</p></div>
      ) : (
        <div className="banners">
          {list.map((b, i) => {
            const [label, cls] = statusOf(b);
            return (
              <div key={b.id} className={`panel banner-row ${label === 'No ar' ? '' : 'banner-row--off'}`}>
                <div className="banner-row__order">
                  <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">▲</button>
                  <b>{i + 1}</b>
                  <button className="icon-btn" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Descer">▼</button>
                </div>
                <img src={imageUrl(b.image)} alt="" className="banner-row__img" />
                <div className="banner-row__info">
                  <b>{b.title || <span className="muted">(sem título)</span>}</b>
                  {b.linkUrl && <span className="small muted">→ {b.linkUrl}</span>}
                  <span className="small">
                    <span className={`status ${cls}`}>{label}</span>
                    {b.endsAt && label === 'No ar' && <span className="muted"> até {formatDate(b.endsAt)}</span>}
                    {b.imageMobile && <span className="muted"> · tem versão celular</span>}
                  </span>
                </div>
                <div className="banner-row__actions">
                  <button className="link small" onClick={() => setEditing(b)}>Editar</button>
                  <button className="link small" onClick={() => toggle(b)}>{b.active ? 'Desativar' : 'Ativar'}</button>
                  <button className="link link--danger small" onClick={() => remove(b)}>Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
