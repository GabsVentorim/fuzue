import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { imageUrl } from '../../assets';
import { useToast } from '../../context/ToastContext';
import { TAG_STATUS, breedLabel, formatDateTime } from '../../labels';
import { formatPhone } from '../../brand';
import QrModal from '../../components/QrModal';
import PreviewModal from '../../components/PreviewModal';
import { Paw, Plus, QrCode, Trash } from '../../components/Icons';

const FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'ativo', label: 'Ativas' },
  { value: 'perdido', label: 'Perdidos' },
  { value: 'inativo', label: 'Desativadas' },
];

export default function Tags() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [preview, setPreview] = useState(null);
  const { notify } = useToast();
  const hasPhotos = list?.some((t) => t.photoUrl);

  const load = useCallback(() => {
    api.admin
      .tags({ q, status })
      .then(setList)
      .catch((err) => setError(err.message));
  }, [q, status]);

  // Busca enquanto digita, com uma pausa para não disparar uma chamada por tecla.
  useEffect(() => {
    const t = setTimeout(load, 220);
    return () => clearTimeout(t);
  }, [load]);

  const setTagStatus = async (tag, next) => {
    try {
      await api.admin.setStatus(tag.id, next);
      notify(next === 'perdido' ? `${tag.petName} marcado como perdido` : `${tag.petName}: status atualizado`);
      load();
    } catch (err) {
      notify(err.message, 'bad');
    }
  };

  const remove = async (tag) => {
    if (!confirm(`Excluir a plaquinha ${tag.code} (${tag.petName})? Isso não pode ser desfeito.`)) return;
    try {
      await api.admin.deleteTag(tag.id);
      notify(`Plaquinha ${tag.code} excluída`);
      load();
    } catch (err) {
      notify(err.message, 'bad');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <h1 className="admin__h1">Plaquinhas</h1>
        <div className="toolbar__right">
          <label className="sr-only" htmlFor="busca">Buscar</label>
          <input
            id="busca"
            className="input"
            placeholder="Buscar por pet, tutor, bairro ou código…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Link className="btn btn--primary btn--sm" to="/admin/nova">
            <Plus width={18} height={18} /> Cadastrar
          </Link>
        </div>
      </div>

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`chip ${status === f.value ? 'chip--on' : ''}`}
            onClick={() => setStatus(f.value)}
          >
            {status === f.value && <span className="chip__pill" />}
            <span className="chip__label">{f.label}</span>
          </button>
        ))}
      </div>

      {error && <p className="alert">{error}</p>}

      {!list ? (
        <p className="muted">Carregando…</p>
      ) : list.length === 0 ? (
        <div className="panel center">
          <Paw width={48} height={48} style={{ margin: '0 auto 10px', color: 'var(--pink-deep)' }} />
          <p className="muted">
            {q || status ? 'Nenhuma plaquinha com esse filtro.' : 'Nenhuma plaquinha cadastrada ainda.'}
          </p>
          {!q && !status && (
            <Link className="btn btn--primary btn--sm" to="/admin/nova">
              Cadastrar a primeira
            </Link>
          )}
        </div>
      ) : (
        <div className="panel" style={{ padding: 8 }}>
          {/* A coluna da foto só aparece quando alguma plaquinha tem foto — senão seria
              uma faixa vazia roubando largura da tabela. */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {hasPhotos && <th className="thumb" />}
                  <th>Código</th>
                  <th>Pet</th>
                  <th>Tutor, bairro & WhatsApp</th>
                  <th>Status</th>
                  <th className="num">Lidas</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className={t.status === 'inativo' ? 'row--muted' : undefined}>
                    {hasPhotos && (
                      <td className="thumb">
                        {t.photoUrl ? <img src={imageUrl(t.photoUrl)} alt="" /> : <span />}
                      </td>
                    )}
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{t.code}</td>
                    <td>
                      <Link className="link" to={`/admin/plaquinhas/${t.id}`}>
                        {t.petName}
                      </Link>
                      <br />
                      <small className="muted">{breedLabel(t)}</small>
                    </td>
                    <td>
                      {t.tutorName}
                      <br />
                      <small className="muted">{t.tutorNeighborhood}</small>
                      <br />
                      <small className="muted mono">{formatPhone(t.tutorWhatsapp)}</small>
                    </td>
                    <td>
                      <select
                        className="input"
                        style={{ padding: '6px 8px', width: 'auto', fontSize: '0.85rem', fontWeight: 800 }}
                        value={t.status}
                        onChange={(e) => setTagStatus(t, e.target.value)}
                        aria-label={`Status de ${t.petName}`}
                      >
                        {Object.entries(TAG_STATUS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="num" title={t.lastScanAt ? `Última: ${formatDateTime(t.lastScanAt)}` : 'Nunca escaneada'}>
                      {t.scanCount}
                    </td>
                    <td>
                      <div className="row row--tight">
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 34, height: 34, color: 'var(--blue)' }}
                          onClick={() => setPreview(t)}
                          title={`Prévia da ficha de ${t.petName}`}
                          aria-label={`Prévia da ficha de ${t.petName}`}
                        >
                          <Paw width={17} height={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 34, height: 34, color: 'var(--red)' }}
                          onClick={() => setQrCode(t.code)}
                          title={`QR Code e endereço NFC de ${t.code}`}
                          aria-label={`QR Code e endereço NFC de ${t.code}`}
                        >
                          <QrCode width={17} height={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => remove(t)}
                          title={`Excluir ${t.code}`}
                          aria-label={`Excluir ${t.code}`}
                          style={{ width: 34, height: 34, color: 'var(--red-dark)' }}
                        >
                          <Trash width={17} height={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small" style={{ padding: '6px 10px 2px', margin: 0 }}>
            {list.length} plaquinha{list.length === 1 ? '' : 's'} · cadastro mais recente primeiro
          </p>
        </div>
      )}

      {qrCode && <QrModal code={qrCode} onClose={() => setQrCode(null)} />}
      {preview && <PreviewModal tag={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
