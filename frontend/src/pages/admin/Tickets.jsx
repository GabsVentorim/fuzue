import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { maskCpf } from '../../cpf';
import { formatDateTime } from '../../labels';

const STATUS = { aberto: 'Em aberto', aprovado: 'Aprovado', recusado: 'Recusado' };
const STATUS_CLASS = { aberto: 'status--aguardando_pagamento', aprovado: 'status--entregue', recusado: 'status--cancelado' };
const TYPE = { cpf_change: 'Troca de CPF' };

function TicketCard({ ticket, onResolved }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const resolve = async (action) => {
    const verb = action === 'approve' ? 'Aprovar a troca de CPF' : 'Recusar o chamado';
    if (!confirm(`${verb} de ${ticket.user.name}?`)) return;
    setBusy(true);
    setError('');
    try {
      onResolved(await api.admin.resolveTicket(ticket.id, action, note));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel ticket">
      <div className="ticket__head">
        <div>
          <b>#{ticket.id} · {TYPE[ticket.type]}</b>
          <span className="muted small"> — {formatDateTime(ticket.createdAt)}</span>
        </div>
        <span className={`status ${STATUS_CLASS[ticket.status]}`}>{STATUS[ticket.status]}</span>
      </div>
      <p className="small">
        <Link to={`/admin/clientes/${ticket.user.id}`} className="link">{ticket.user.name}</Link>
        <span className="muted"> · {ticket.user.email}</span>
      </p>
      {ticket.type === 'cpf_change' && (
        <div className="ticket__cpf">
          <span><small className="muted">CPF atual</small><b>{maskCpf(ticket.data.oldCpf)}</b></span>
          <span className="ticket__arrow">→</span>
          <span><small className="muted">CPF pedido</small><b>{maskCpf(ticket.data.newCpf)}</b></span>
        </div>
      )}
      <p className="small"><span className="muted">Motivo:</span> {ticket.message}</p>

      {ticket.status === 'aberto' ? (
        <>
          <input className="input" placeholder="Observação para o cliente (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <p className="alert small">{error}</p>}
          <div className="row">
            <button className="btn btn--primary btn--sm" disabled={busy} onClick={() => resolve('approve')}>Aprovar troca</button>
            <button className="btn btn--ghost btn--sm" disabled={busy} onClick={() => resolve('reject')}>Recusar</button>
          </div>
        </>
      ) : (
        <p className="small muted">
          Resolvido em {formatDateTime(ticket.resolvedAt)}{ticket.adminNote && ` — “${ticket.adminNote}”`}
        </p>
      )}
    </div>
  );
}

export default function Tickets() {
  const [status, setStatus] = useState('aberto');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setList(null);
    api.admin.tickets({ status }).then(setList).catch((e) => setError(e.message));
  }, [status]);

  const resolved = (t) => setList((l) => (status === 'aberto' ? l.filter((x) => x.id !== t.id) : l.map((x) => (x.id === t.id ? t : x))));

  return (
    <div className="stack">
      <div className="toolbar">
        <h1 className="admin__h1">Chamados</h1>
        <div className="chips">
          {[['aberto', 'Em aberto'], ['', 'Todos']].map(([k, l]) => (
            <button key={l} className={`chip ${status === k ? 'chip--on' : ''}`} onClick={() => setStatus(k)}>{l}</button>
          ))}
        </div>
      </div>
      <p className="muted small">Pedidos dos clientes que precisam de você — por enquanto, trocas de CPF (o cliente não consegue trocar sozinho).</p>
      {error && <p className="alert">{error}</p>}
      {!list ? (
        <p className="muted">Carregando…</p>
      ) : list.length === 0 ? (
        <div className="panel"><p className="muted">{status === 'aberto' ? 'Nenhum chamado em aberto 🎉' : 'Nenhum chamado ainda.'}</p></div>
      ) : (
        <div className="tickets">
          {list.map((t) => <TicketCard key={t.id} ticket={t} onResolved={resolved} />)}
        </div>
      )}
    </div>
  );
}
