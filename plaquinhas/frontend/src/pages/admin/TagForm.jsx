import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { imageUrl } from '../../assets';
import { useToast } from '../../context/ToastContext';
import { BREEDS, SPECIES, SEX, PET_SIZES, TAG_STATUS, formatDate, formatDateTime } from '../../labels';
import { porteForBreed, collarSizesForBreed } from '../../sizes';
import QrModal from '../../components/QrModal';
import PreviewModal from '../../components/PreviewModal';
import { Paw, QrCode, Sparkle, Trash } from '../../components/Icons';

const empty = {
  code: '',
  petName: '',
  species: 'cachorro',
  sex: 'macho',
  breed: '',
  isMixed: false,
  size: 'medio',
  notes: '',
  tutorName: '',
  tutorNeighborhood: '',
  tutorWhatsapp: '',
  tutorPhone: '',
  status: 'ativo',
};

export default function TagForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useToast();

  const [form, setForm] = useState(empty);
  const [tag, setTag] = useState(null); // dados salvos (foto, leituras, datas)
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [qrOpen, setQrOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef(null);

  // Num cadastro novo a plaquinha ainda não existe, então a foto não tem onde ser guardada.
  // O arquivo fica aqui e sobe logo depois de salvar.
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [pendingPreview, setPendingPreview] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // Escolher a raça já acerta o porte: a loja conhece a medida de pescoço de cada raça,
  // então quem cadastra não precisa adivinhar. Continua editável depois.
  const setBreed = (value) => {
    const porte = porteForBreed(value);
    setForm((f) => ({ ...f, breed: value, size: porte || f.size }));
  };

  const suggestedCollar = !form.isMixed ? collarSizesForBreed(form.breed) : [];

  useEffect(() => {
    if (editing) {
      api.admin
        .tag(id)
        .then((t) => {
          setTag(t);
          setForm({ ...empty, ...t, breed: t.breed || '', tutorPhone: t.tutorPhone || '', notes: t.notes || '' });
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      api.admin
        .nextCode()
        .then(({ code }) => setForm((f) => (f.code ? f : { ...f, code })))
        .catch(() => {});
    }
  }, [editing, id]);

  // libera a URL temporária da foto escolhida, para não vazar memória
  useEffect(() => () => pendingPreview && URL.revokeObjectURL(pendingPreview), [pendingPreview]);

  const suggestCode = async () => {
    try {
      const { code } = await api.admin.nextCode();
      setForm((f) => ({ ...f, code }));
    } catch (err) {
      notify(err.message, 'bad');
    }
  };

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (editing) return uploadPhoto(file);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPhoto(file);
    setPendingPreview(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadPhoto = async (file) => {
    try {
      setTag(await api.admin.uploadPhoto(tag.id, file));
      notify('Foto atualizada');
    } catch (err) {
      notify(err.message, 'bad');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    if (!editing) {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingPhoto(null);
      setPendingPreview('');
      return;
    }
    try {
      setTag(await api.admin.removePhoto(tag.id));
      notify('Foto removida');
    } catch (err) {
      notify(err.message, 'bad');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = editing ? await api.admin.updateTag(id, form) : await api.admin.createTag(form);

      // A plaquinha existe agora, então a foto escolhida no formulário já tem onde morar.
      if (!editing && pendingPhoto) {
        try {
          await api.admin.uploadPhoto(saved.id, pendingPhoto);
        } catch (err) {
          notify(`Plaquinha salva, mas a foto não subiu: ${err.message}`, 'bad');
        }
      }

      notify(editing ? 'Plaquinha atualizada' : `Plaquinha ${saved.code} cadastrada`);
      setTag(saved);
      if (!editing) navigate(`/admin/plaquinhas/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Excluir a plaquinha ${tag.code} (${tag.petName})? Isso não pode ser desfeito.`)) return;
    try {
      await api.admin.deleteTag(tag.id);
      notify(`Plaquinha ${tag.code} excluída`);
      navigate('/admin/plaquinhas', { replace: true });
    } catch (err) {
      notify(err.message, 'bad');
    }
  };

  if (loading) return <p className="muted">Carregando…</p>;
  if (editing && !tag && error) return <p className="alert">{error}</p>;

  const photo = pendingPreview || imageUrl(tag?.photoUrl);
  // A prévia mostra o que está no formulário agora, não o que está salvo. O telefone
  // repete a regra do servidor (sem telefone informado, ligar usa o WhatsApp) — senão
  // a prévia mostraria um botão a menos do que a ficha de verdade.
  const previewTag = {
    ...form,
    photoUrl: photo,
    tutorPhone: form.tutorPhone || form.tutorWhatsapp,
  };

  return (
    <div className="stack">
      <p className="crumbs">
        <Link to="/admin">Painel</Link> › <Link to="/admin/plaquinhas">Plaquinhas</Link> ›{' '}
        {editing ? tag?.code : 'nova'}
      </p>

      <div className="toolbar">
        <h1 className="admin__h1">{editing ? `Plaquinha ${tag?.code}` : 'Cadastrar plaquinha'}</h1>
        <div className="toolbar__right">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPreviewOpen(true)}>
            <Paw width={17} height={17} /> Ver prévia da ficha
          </button>
          {editing && (
            <>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setQrOpen(true)}>
                <QrCode width={17} height={17} /> Gravar medalha
              </button>
              <a className="btn btn--ghost btn--sm" href={`/tag/${tag.code}`} target="_blank" rel="noreferrer">
                Abrir ficha
              </a>
            </>
          )}
        </div>
      </div>

      <fieldset className="box">
        <legend>Foto do pet</legend>
        <div className="field--full row" style={{ gap: 20 }}>
          {photo ? (
            <img
              src={photo}
              alt={form.petName || 'Foto do pet'}
              style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', background: 'var(--pink-soft)' }}
            />
          ) : (
            <span
              style={{
                width: 110, height: 110, borderRadius: '50%', background: 'var(--pink-soft)',
                display: 'grid', placeItems: 'center', color: 'var(--pink-deep)',
              }}
            >
              <Paw width={46} height={46} />
            </span>
          )}
          <div className="stack" style={{ gap: 8 }}>
            <label className="btn btn--ghost btn--sm">
              {photo ? 'Trocar foto' : 'Escolher foto do computador'}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
            </label>
            {photo && (
              <button type="button" className="link link--danger small" onClick={removePhoto}>
                Remover foto
              </button>
            )}
            <small className="muted">
              JPG, PNG, WEBP ou GIF, até 5 MB.
              {!editing && pendingPhoto && ' A foto sobe junto quando você salvar.'}
            </small>
          </div>
        </div>
      </fieldset>

      <form onSubmit={submit} className="stack">
        <fieldset className="box">
          <legend>O pet</legend>

          <label className="field">
            Código da medalha
            <input
              className="input mono"
              required
              placeholder="FZ-7H2KM"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <button type="button" className="link small" onClick={suggestCode}>
              <Sparkle width={13} height={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> Gerar outro código
            </button>
          </label>

          <label className="field">
            Nome do pet
            <input className="input" required placeholder="Ex.: Thor" value={form.petName} onChange={set('petName')} />
          </label>

          <label className="field">
            Espécie
            <select
              className="input"
              value={form.species}
              onChange={(e) => setForm({ ...form, species: e.target.value, breed: '' })}
            >
              {Object.entries(SPECIES).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>

          <label className="field">
            Sexo
            <select className="input" value={form.sex} onChange={set('sex')}>
              {Object.entries(SEX).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>

          <label className="field">
            Raça
            <input
              className="input"
              list="racas"
              placeholder={form.isMixed ? 'vira-lata não precisa de raça' : 'Comece a digitar…'}
              value={form.breed}
              onChange={(e) => setBreed(e.target.value)}
              disabled={form.isMixed}
            />
            <datalist id="racas">
              {(BREEDS[form.species] || []).map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            {!form.isMixed && suggestedCollar.length > 0 && (
              <small className="good">
                Porte preenchido pela raça · coleira {suggestedCollar.join(' ou ')}
              </small>
            )}
          </label>

          <label className="field">
            Porte
            <select className="input" value={form.size} onChange={set('size')}>
              {Object.entries(PET_SIZES).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>

          <div className="field field--full">
            <label className="check">
              <input type="checkbox" checked={form.isMixed} onChange={set('isMixed')} /> Vira-lata (SRD)
            </label>
          </div>

          <label className="field field--full">
            Cuidados & saúde
            <textarea
              className="input"
              rows={3}
              placeholder="Ex.: alérgico a dipirona, tem medo de fogos, toma remédio para o coração…"
              value={form.notes}
              onChange={set('notes')}
            />
            <small className="muted">
              Aparece em destaque para quem encontrar o pet. Não escreva endereço completo aqui.
            </small>
          </label>
        </fieldset>

        <fieldset className="box">
          <legend>O tutor</legend>

          <label className="field">
            Nome do tutor
            <input className="input" required placeholder="Ex.: Mariana Santos" value={form.tutorName} onChange={set('tutorName')} />
          </label>

          <label className="field">
            Bairro
            <input
              className="input"
              required
              placeholder="Ex.: Praia do Canto - Vitória/ES"
              value={form.tutorNeighborhood}
              onChange={set('tutorNeighborhood')}
            />
            <small className="muted">Bairro e cidade — nunca rua e número.</small>
          </label>

          <label className="field">
            WhatsApp
            <input
              className="input"
              required
              inputMode="numeric"
              placeholder="27999887766"
              value={form.tutorWhatsapp}
              onChange={set('tutorWhatsapp')}
            />
            <small className="muted">DDD + número. O 55 é adicionado automaticamente.</small>
          </label>

          <label className="field">
            Telefone para ligação
            <input
              className="input"
              inputMode="numeric"
              placeholder="deixe vazio para usar o WhatsApp"
              value={form.tutorPhone}
              onChange={set('tutorPhone')}
            />
          </label>

          <label className="field field--full">
            Status da plaquinha
            <select className="input" value={form.status} onChange={set('status')}>
              {Object.entries(TAG_STATUS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <small className="muted">
              “Pet perdido” mostra um alerta vermelho na ficha. “Desativada” faz a ficha deixar de abrir.
            </small>
          </label>
        </fieldset>

        {error && <p className="alert">{error}</p>}

        <div className="row">
          <button className="btn btn--primary" disabled={saving}>
            {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar plaquinha'}
          </button>
          <Link className="btn btn--ghost" to="/admin/plaquinhas">
            Cancelar
          </Link>
          {editing && (
            <button type="button" className="link link--danger push-right" onClick={remove}>
              <Trash width={15} height={15} style={{ display: 'inline', verticalAlign: '-3px' }} /> Excluir plaquinha
            </button>
          )}
        </div>
      </form>

      {editing && tag && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Histórico</h3>
          <ul className="kv">
            <li>
              <span>Cadastrada em</span>
              <b>{formatDate(tag.createdAt)}</b>
            </li>
            <li>
              <span>Última alteração</span>
              <b>{tag.updatedAt ? formatDateTime(tag.updatedAt) : '—'}</b>
            </li>
            <li>
              <span>Vezes escaneada</span>
              <b>{tag.scanCount}</b>
            </li>
            <li>
              <span>Última leitura</span>
              <b>{tag.lastScanAt ? formatDateTime(tag.lastScanAt) : 'nunca'}</b>
            </li>
          </ul>
        </div>
      )}

      {qrOpen && tag && <QrModal code={tag.code} onClose={() => setQrOpen(false)} />}
      {previewOpen && <PreviewModal tag={previewTag} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}
