import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import CpfInput from '../../components/CpfInput';
import { isValidCpf, maskCpf } from '../../cpf';
import { formatDate } from '../../labels';

const STATUS = { aberto: 'Em análise', aprovado: 'Aprovado', recusado: 'Recusado' };
const STATUS_CLASS = { aberto: 'status--aguardando_pagamento', aprovado: 'status--entregue', recusado: 'status--cancelado' };

// CPF on the account: saved once, then locked. Changing it requires a support ticket ("chamado").
export default function CpfSection() {
  const { user, setUser } = useAuth();
  const [cpf, setCpf] = useState('');
  const [tickets, setTickets] = useState([]);
  const [asking, setAsking] = useState(false);
  const [req, setReq] = useState({ newCpf: '', message: '' });
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.myTickets().then(setTickets).catch(() => {});
  }, []);

  const cpfTickets = tickets.filter((t) => t.type === 'cpf_change');
  const open = cpfTickets.find((t) => t.status === 'aberto');
  const last = cpfTickets[0];

  const saveCpf = async (e) => {
    e.preventDefault();
    if (!isValidCpf(cpf)) return setMsg({ error: 'Confira o CPF — ele está inválido.' });
    if (!confirm(`Confirmar o CPF ${maskCpf(cpf)}? Depois ele só poderá ser trocado por chamado.`)) return;
    setBusy(true);
    try {
      setUser(await api.setCpf(cpf));
      setMsg({ ok: 'CPF salvo!' });
    } catch (err) {
      setMsg({ error: err.message });
    } finally {
      setBusy(false);
    }
  };

  const sendTicket = async (e) => {
    e.preventDefault();
    if (!isValidCpf(req.newCpf)) return setMsg({ error: 'O novo CPF está inválido.' });
    setBusy(true);
    try {
      const t = await api.requestCpfChange(req.newCpf, req.message);
      setTickets([t, ...tickets]);
      setAsking(false);
      setReq({ newCpf: '', message: '' });
      setMsg({ ok: 'Chamado aberto! Vamos analisar e te avisar.' });
    } catch (err) {
      setMsg({ error: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="box cpf-box">
      <h3 className="cpf-box__title">CPF</h3>

      {!user.cpf ? (
        <form className="cpf-box__row" onSubmit={saveCpf}>
          <CpfInput value={cpf} onChange={setCpf} label="Cadastre seu CPF" hint="Precisamos dele para emitir a nota e enviar seus pedidos." />
          <button className="btn btn--primary btn--sm" disabled={busy}>Salvar CPF</button>
        </form>
      ) : (
        <>
          <div className="cpf-box__row">
            <CpfInput value={user.cpf} onChange={() => {}} locked label="Seu CPF" />
            {!open && !asking && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setAsking(true); setMsg({}); }}>
                Solicitar troca de CPF
              </button>
            )}
          </div>
          <p className="muted small">Por segurança, o CPF não pode ser alterado por aqui. Para trocar, abra um chamado.</p>

          {asking && (
            <form className="cpf-box__ticket" onSubmit={sendTicket}>
              <CpfInput value={req.newCpf} onChange={(newCpf) => setReq({ ...req, newCpf })} label="CPF correto" />
              <label className="field">
                Motivo da troca
                <textarea className="input" rows={2} required placeholder="Ex.: digitei errado no cadastro" value={req.message}
                  onChange={(e) => setReq({ ...req, message: e.target.value })} />
              </label>
              <div className="row">
                <button className="btn btn--primary btn--sm" disabled={busy}>Abrir chamado</button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAsking(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </>
      )}

      {last && (
        <div className="cpf-box__status small">
          <span className={`status ${STATUS_CLASS[last.status]}`}>{STATUS[last.status]}</span>
          Pedido de troca para {maskCpf(last.data.newCpf)} em {formatDate(last.createdAt)}
          {last.adminNote && <span className="muted"> — “{last.adminNote}”</span>}
        </div>
      )}
      {msg.ok && <p className="good">{msg.ok}</p>}
      {msg.error && <p className="alert">{msg.error}</p>}
    </div>
  );
}
