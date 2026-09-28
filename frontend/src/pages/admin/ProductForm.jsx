import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import ProductArt from '../../components/ProductArt';

const PATTERNS = { plain: 'Lisa', dots: 'Bolinhas', stripes: 'Listras', hearts: 'Corações' };
const DEFAULT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'Único'];

const empty = {
  name: '', category: 'coleiras', price: '', description: '', colors: [{ name: '', hex: '#E8432A' }],
  sizes: ['P', 'M', 'G'], pattern: 'plain', badge: '', featured: false, active: true, image: '',
  stock: 0, lowStockThreshold: 5,
};

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState(isNew ? empty : null);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
    if (!isNew) api.admin.product(id).then((p) => setForm({ ...empty, ...p, badge: p.badge || '', image: p.image || '' })).catch((e) => setError(e.message));
  }, [id, isNew]);

  if (!form) return error ? <p className="alert">{error}</p> : <p className="muted">Carregando…</p>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setColor = (i, k, v) => setForm({ ...form, colors: form.colors.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)) });
  const toggleSize = (s) =>
    setForm({ ...form, sizes: form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : [...form.sizes, s] });

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await api.admin.uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form, price: Number(String(form.price).replace(',', '.')) };
      if (isNew) await api.admin.createProduct(body);
      else await api.admin.updateProduct(id, body);
      navigate('/admin/produtos');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Excluir "${form.name}"? Isso não pode ser desfeito.`)) return;
    try {
      await api.admin.deleteProduct(id);
      navigate('/admin/produtos');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <p className="crumbs"><Link to="/admin/produtos">Produtos</Link> / {isNew ? 'Novo' : form.name}</p>
      <h1 className="admin__h1">{isNew ? 'Novo produto' : 'Editar produto'}</h1>

      <form className="product-form" onSubmit={submit}>
        <fieldset className="box">
          <legend>Informações</legend>
          <label className="field field--full">Nome<input className="input" required value={form.name} onChange={set('name')} /></label>
          <label className="field">
            Categoria
            <select className="input" value={form.category} onChange={set('category')}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label className="field">Preço (R$)<input className="input" required inputMode="decimal" value={form.price} onChange={set('price')} /></label>
          <label className="field field--full">Descrição<textarea className="input" rows={4} value={form.description} onChange={set('description')} /></label>
          <label className="field">Selo (opcional)<input className="input" placeholder="Novidade, Mais vendida…" value={form.badge} onChange={set('badge')} /></label>
          <div className="field">
            <span>Visibilidade</span>
            <label className="check"><input type="checkbox" checked={form.active} onChange={set('active')} /> Ativo na loja</label>
            <label className="check"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Destaque na home</label>
          </div>
        </fieldset>

        <fieldset className="box">
          <legend>Cores e tamanhos</legend>
          <div className="field field--full">
            <span>Cores</span>
            {form.colors.map((c, i) => (
              <div key={i} className="row">
                <input type="color" className="color-input" value={c.hex} onChange={(e) => setColor(i, 'hex', e.target.value)} aria-label="Cor" />
                <input className="input" placeholder="Nome da cor" value={c.name} onChange={(e) => setColor(i, 'name', e.target.value)} />
                {form.colors.length > 1 && (
                  <button type="button" className="link link--danger" onClick={() => setForm({ ...form, colors: form.colors.filter((_, idx) => idx !== i) })}>remover</button>
                )}
              </div>
            ))}
            <div><button type="button" className="link" onClick={() => setForm({ ...form, colors: [...form.colors, { name: '', hex: '#377DF8' }] })}>+ adicionar cor</button></div>
          </div>
          <div className="field field--full">
            <span>Tamanhos (nenhum = tamanho único)</span>
            <div className="chips">
              {[...new Set([...DEFAULT_SIZES, ...form.sizes])].map((s) => (
                <button type="button" key={s} className={`chip ${form.sizes.includes(s) ? 'chip--on' : ''}`} onClick={() => toggleSize(s)}>{s}</button>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset className="box">
          <legend>Imagem</legend>
          <div className="product-form__preview tint-pink">
            <ProductArt category={form.category} color={form.colors[0]?.hex} pattern={form.pattern} image={form.image} alt={form.name} />
          </div>
          <div className="field">
            <label className="btn btn--ghost btn--sm">
              {uploading ? 'Enviando…' : form.image ? 'Trocar foto' : 'Enviar foto'}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files[0])} />
            </label>
            {form.image && <button type="button" className="link link--danger" onClick={() => setForm({ ...form, image: '' })}>Usar ilustração</button>}
            <small className="muted">JPG, PNG ou WEBP até 5 MB, de preferência quadrada. Sem foto, usamos a ilustração:</small>
            <select className="input" value={form.pattern} onChange={set('pattern')}>
              {Object.entries(PATTERNS).map(([k, l]) => <option key={k} value={k}>Estampa: {l}</option>)}
            </select>
          </div>
        </fieldset>

        <fieldset className="box">
          <legend>Estoque</legend>
          {isNew ? (
            <label className="field">Estoque inicial<input className="input" type="number" min={0} value={form.stock} onChange={set('stock')} /></label>
          ) : (
            <p className="field">
              <span>Em estoque: <b>{form.stock}</b></span>
              <Link to={`/admin/estoque?produto=${id}`} className="link small">Dar entrada ou ajustar →</Link>
            </p>
          )}
          <label className="field">Avisar quando tiver até<input className="input" type="number" min={0} value={form.lowStockThreshold} onChange={set('lowStockThreshold')} /></label>
        </fieldset>

        {error && <p className="alert">{error}</p>}
        <div className="row">
          <button className="btn btn--primary" disabled={saving || uploading}>{saving ? 'Salvando…' : 'Salvar produto'}</button>
          <Link to="/admin/produtos" className="btn btn--ghost">Cancelar</Link>
          {!isNew && <button type="button" className="link link--danger push-right" onClick={remove}>Excluir produto</button>}
        </div>
      </form>
    </div>
  );
}
