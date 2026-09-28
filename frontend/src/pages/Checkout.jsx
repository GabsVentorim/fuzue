import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../brand';
import { useAuth } from '../context/AuthContext';
import { lookupCep } from '../cep';

const empty = { name: '', email: '', phone: '', cep: '', address: '', number: '', complement: '', city: '', state: '' };

const payments = [
  { id: 'pix', label: 'Pix', hint: '5% de desconto' },
  { id: 'cartao', label: 'Cartão', hint: 'até 3x sem juros' },
  { id: 'boleto', label: 'Boleto', hint: 'vence em 3 dias' },
];

export default function Checkout() {
  const { items, subtotal, shipping, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [payment, setPayment] = useState('pix');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [saved, setSaved] = useState([]);
  const [saveAddress, setSaveAddress] = useState(true);

  // Logged in: pre-fill contact info and the default saved address.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone }));
    api.addresses().then((list) => {
      setSaved(list);
      const def = list.find((a) => a.isDefault) || list[0];
      if (def) applyAddress(def);
    }).catch(() => {});
  }, [user]);

  function applyAddress(a) {
    setForm((f) => ({ ...f, cep: a.cep, address: a.address, number: a.number, complement: a.complement, city: a.city, state: a.state }));
  }

  const sameAs = (a) => ['cep', 'address', 'number', 'complement', 'city', 'state'].every(
    (k) => String(a[k] || '').trim().toLowerCase() === String(form[k] || '').trim().toLowerCase()
  );
  const isNewAddress = user && !saved.some(sameAs);

  if (items.length === 0) {
    return (
      <section className="section container empty">
        <h1>Nada por aqui ainda</h1>
        <Link to="/loja" className="btn btn--primary">Ir para a loja</Link>
      </section>
    );
  }

  const discount = payment === 'pix' ? subtotal * 0.05 : 0;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Auto-fill address from the CEP.
  const fillFromCep = async () => {
    const r = await lookupCep(form.cep);
    if (r) setForm((f) => ({ ...f, address: r.address || f.address, city: r.city, state: r.state }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const order = await api.createOrder({
        customer: form,
        payment,
        items: items.map(({ productId, qty, size, color }) => ({ productId, qty, size, color })),
      });
      if (isNewAddress && saveAddress) {
        const { cep, address, number, complement, city, state } = form;
        await api.addAddress({ cep, address, number, complement, city, state }).catch(() => {});
      }
      clear();
      navigate(`/pedido/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="section container">
      <h1 className="page-title">Finalizar compra</h1>
      {!user && (
        <p className="muted">
          Já tem conta? <Link to="/entrar" state={{ from: '/checkout' }} className="link">Entre</Link> para preencher seus dados automaticamente.
        </p>
      )}
      <form className="checkout" onSubmit={submit}>
        <div className="checkout__form">
          <fieldset className="box">
            <legend>Seus dados</legend>
            <label className="field field--full">Nome completo<input className="input" required value={form.name} onChange={set('name')} /></label>
            <label className="field">E-mail<input className="input" type="email" required value={form.email} onChange={set('email')} /></label>
            <label className="field">WhatsApp<input className="input" type="tel" required placeholder="(11) 99999-9999" value={form.phone} onChange={set('phone')} /></label>
          </fieldset>

          <fieldset className="box">
            <legend>Endereço de entrega</legend>
            {saved.length > 0 && (
              <label className="field field--full">
                Endereços salvos
                <select className="input" value={saved.find(sameAs)?.id || ''} onChange={(e) => { const a = saved.find((x) => x.id === Number(e.target.value)); if (a) applyAddress(a); }}>
                  <option value="">Outro endereço</option>
                  {saved.map((a) => (
                    <option key={a.id} value={a.id}>{a.label ? `${a.label} — ` : ''}{a.address}, {a.number} · {a.city}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">CEP<input className="input" required placeholder="00000-000" value={form.cep} onChange={set('cep')} onBlur={fillFromCep} /></label>
            <label className="field field--full">Rua<input className="input" required value={form.address} onChange={set('address')} /></label>
            <label className="field">Número<input className="input" required value={form.number} onChange={set('number')} /></label>
            <label className="field">Complemento<input className="input" value={form.complement} onChange={set('complement')} /></label>
            <label className="field">Cidade<input className="input" required value={form.city} onChange={set('city')} /></label>
            <label className="field">Estado<input className="input" required maxLength={2} value={form.state} onChange={set('state')} /></label>
            {isNewAddress && (
              <label className="check field--full">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                Salvar este endereço na minha conta
              </label>
            )}
          </fieldset>

          <fieldset className="box">
            <legend>Pagamento</legend>
            <div className="pay">
              {payments.map((p) => (
                <label key={p.id} className={`pay__opt ${payment === p.id ? 'pay__opt--on' : ''}`}>
                  <input type="radio" name="payment" value={p.id} checked={payment === p.id} onChange={() => setPayment(p.id)} />
                  <strong>{p.label}</strong>
                  <small>{p.hint}</small>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="summary">
          <h2>Seu pedido</h2>
          {items.map((i) => (
            <div key={`${i.productId}-${i.size}-${i.color}`} className="summary__row small">
              <span>{i.qty}× {i.name}{i.size ? ` (${i.size})` : ''}</span>
              <span>{formatPrice(i.price * i.qty)}</span>
            </div>
          ))}
          <hr />
          <div className="summary__row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="summary__row"><span>Frete</span><span>{shipping ? formatPrice(shipping) : 'Grátis'}</span></div>
          {discount > 0 && <div className="summary__row good"><span>Desconto Pix</span><span>−{formatPrice(discount)}</span></div>}
          <div className="summary__row summary__total"><span>Total</span><span>{formatPrice(subtotal + shipping - discount)}</span></div>
          {error && <p className="alert">{error}</p>}
          <button className="btn btn--primary btn--block" disabled={sending}>
            {sending ? 'Enviando…' : 'Confirmar pedido'}
          </button>
        </aside>
      </form>
    </section>
  );
}
