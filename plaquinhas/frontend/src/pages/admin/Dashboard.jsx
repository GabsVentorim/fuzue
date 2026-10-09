import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { formatDate, formatDateTime } from '../../labels';
import { Alert, Plus } from '../../components/Icons';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.dashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="alert">{error}</p>;
  if (!data) return <p className="muted">Carregando…</p>;

  return (
    <div className="stack">
      <div className="toolbar">
        <h1 className="admin__h1">Visão geral</h1>
        <Link className="btn btn--primary btn--sm" to="/admin/nova">
          <Plus width={18} height={18} /> Cadastrar plaquinha
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat__label">Plaquinhas</span>
          <span className="stat__value">{data.total}</span>
          <span className="stat__hint">cadastradas no total</span>
        </div>
        <div className="stat">
          <span className="stat__label">Ativas</span>
          <span className="stat__value">{data.ativas}</span>
          <span className="stat__hint">prontas para uso</span>
        </div>
        <div className="stat">
          <span className="stat__label">Pets perdidos</span>
          <span className="stat__value" style={data.perdidos ? { color: 'var(--red)' } : undefined}>
            {data.perdidos}
          </span>
          <span className="stat__hint">marcados agora</span>
        </div>
        <div className="stat">
          <span className="stat__label">Desativadas</span>
          <span className="stat__value">{data.inativas}</span>
          <span className="stat__hint">não abrem mais a ficha</span>
        </div>
        <div className="stat">
          <span className="stat__label">Escaneamentos</span>
          <span className="stat__value">{data.escaneamentos}</span>
          <span className="stat__hint">medalhas lidas</span>
        </div>
      </div>

      {data.perdidosAgora.length > 0 && (
        <div className="panel">
          <div className="panel__head">
            <h2>
              <Alert width={18} height={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 6, color: 'var(--red)' }} />
              Pets marcados como perdidos
            </h2>
          </div>
          <div className="tiles">
            {data.perdidosAgora.map((t) => (
              <Link to={`/admin/plaquinhas/${t.id}`} className="tile tile--row" key={t.id}>
                <div>
                  <b>{t.petName}</b>
                  <small className="muted">
                    {t.tutorName} · {t.tutorNeighborhood}
                  </small>
                </div>
                <div className="tile__end">
                  <span className="mono small">{t.code}</span>
                  <span className="status status--perdido">Perdido</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel__head">
          <h2>Últimas cadastradas</h2>
          <Link className="link" to="/admin/plaquinhas">
            Ver todas
          </Link>
        </div>
        {data.ultimas.length === 0 ? (
          <p className="muted">
            Nenhuma plaquinha ainda. <Link className="link" to="/admin/nova">Cadastre a primeira</Link>.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Pet</th>
                  <th>Tutor</th>
                  <th>Status</th>
                  <th className="num">Leituras</th>
                  <th>Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {data.ultimas.map((t) => (
                  <tr key={t.id}>
                    <td className="mono">{t.code}</td>
                    <td>
                      <Link className="link" to={`/admin/plaquinhas/${t.id}`}>
                        {t.petName}
                      </Link>
                    </td>
                    <td>{t.tutorName}</td>
                    <td>
                      <span className={`status status--${t.status}`}>{t.status}</span>
                    </td>
                    <td className="num" title={t.lastScanAt ? `Última: ${formatDateTime(t.lastScanAt)}` : 'Nunca escaneada'}>
                      {t.scanCount}
                    </td>
                    <td>{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
