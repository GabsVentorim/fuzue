import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../brand';
import { useAuth } from '../context/AuthContext';
import { lookupCep } from '../cep';
import CpfInput from '../components/CpfInput';
import { isValidCpf } from '../cpf';
import ShippingCalculator, { maskCep } from '../components/ShippingCalculator';

const empty = { name: '', email: '', phone: '', cpf: '', cep: '', address: '', number: '', complement: '', city: '', state: '' };

const payments = [
  { id: 'pix', label: 'Pix', hint: '5% de desconto' },
  { id: 'cartao', label: 'Cartão', hint: 'até 3x sem juros' },
  { id: 'boleto', label: 'Boleto', hint: 'vence em 3 dias' },
];

export default function Checkout() {
  const { items, subtotal, shipping, clear, shippingEnabled, ship, setShipCep, chooseShipping } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({ ...empty, cep: maskCep(ship.cep) }));
  const [payment, setPayment] = useState('pix');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // coupon: `coupon` is the server's answer ({ code, label, discount, freeShipping })
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applying, setApplying] = useState(false);
  const { user, setUser } = useAuth();
  const [saved, setSaved] = useState([]);
  const [saveAddress, setSaveAddress] = useState(true);

  // Logged in: pre-fill contact info and the default saved address.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone, cpf: user.cpf || f.cpf }));
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

  // The address CEP drives the shipping quote.
  const cepDigits = form.cep.replace(/\D/g, '');
  useEffect(() => {
    if (cepDigits.length === 8) setShipCep(maskCep(cepDigits));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepDigits]);

  if (items.length === 0) {
    return (
      <section className="section container empty">
        <h1>Nada por aqui ainda</h1>
        <Link to="/loja" className="btn btn--primary">Ir para a loja</Link>
      </section>
    );
  }

  // same rounding as the server, so the total shown is exactly the total charged
  const round2 = (n) => Math.round(n * 100) / 100;
  const couponDiscount = coupon?.discount || 0;
  const shippingCost = coupon?.freeShipping ? 0 : shipping;
  // same rules as the server: Pix 5% on the products after the coupon
  const discount = payment === 'pix' ? round2((round2(subtotal) - couponDiscount) * 0.05) : 0;
  const total = round2(subtotal - couponDiscount + (shippingCost || 0) - discount);

  const cartItems = () => items.map(({ productId, qty }) => ({ productId, qty }));
  const applyCoupon = async () => {
    if (!couponInput.trim()) return setCouponError('Digite o código do cupom.');
    setApplying(true);
    setCouponError('');
    try {
      setCoupon(await api.validateCoupon(couponInput, cartItems(), user?.cpf || form.cpf));
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setApplying(false);
    }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Auto-fill address from the CEP.
  const fillFromCep = async () => {
    const r = await lookupCep(form.cep);
    if (r) setForm((f) => ({ ...f, address: r.address || f.address, city: r.city, state: r.state }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!isValidCpf(user?.cpf || form.cpf)) return setError('Confira o CPF — ele está inválido.');
    if (shippingEnabled && !ship.option) return setError('Escolha uma opção de entrega.');
    setSending(true);
    setError('');
    try {
      const order = await api.createOrder({
        customer: form,
        payment,
        shippingService: ship.option?.id,
        couponCode: coupon?.code,
        items: items.map(({ productId, qty, size, color }) => ({ productId, qty, size, color })),
      });
      if (isNewAddress && saveAddress) {
        const { cep, address, number, complement, city, state } = form;
        await api.addAddress({ cep, address, number, complement, city, state }).catch(() => {});
      }
      if (user && !user.cpf) setUser({ ...user, cpf: form.cpf }); // the order saved it on the account
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
            <CpfInput
              value={user?.cpf || form.cpf}
              onChange={(cpf) => { setForm((f) => ({ ...f, cpf })); setCoupon(null); }}
              locked={!!user?.cpf}
              hint={user ? 'Ficará salvo na sua conta.' : undefined}
            />
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

          {shippingEnabled && (
            <fieldset className="box">
              <legend>Entrega</legend>
              <div className="field--full">
                {cepDigits.length === 8 ? (
                  <ShippingCalculator
                    hideInput
                    auto
                    items={items.map(({ productId, qty }) => ({ productId, qty }))}
                    cep={form.cep}
                    selectedId={ship.option?.id}
                    onSelect={(o, q) => { chooseShipping(o, q.cep); setError(''); }}
                    onQuote={(q) => {
                      if (!q) return;
                      const same = q.options.find((o) => o.id === ship.option?.id);
                      chooseShipping(same || q.options[0], q.cep);
                    }}
                  />
                ) : (
                  <p className="muted small">Preencha o CEP no endereço para ver as opções de entrega.</p>
                )}
              </div>
            </fieldset>
          )}

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

            <div className="coupon field--full">
              <span className="coupon__title">🎟️ Cupom de desconto</span>
              {coupon ? (
                <div className="coupon__applied">
                  <span>
                    <b>{coupon.code}</b>
                    <small>{coupon.label}{couponDiscount > 0 && ` · −${formatPrice(couponDiscount)}`}</small>
                  </span>
                  <button type="button" className="link link--danger" onClick={() => setCoupon(null)}>remover</button>
                </div>
              ) : (
                <div className="coupon__row">
                  <input
                    className="input"
                    placeholder="Digite o código"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                    aria-label="Código do cupom"
                  />
                  <button type="button" className="btn btn--ghost btn--sm" disabled={applying} onClick={applyCoupon}>
                    {applying ? '…' : 'Aplicar'}
                  </button>
                </div>
              )}
              {couponError && <p className="alert small">{couponError}</p>}
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
          <div className="summary__row">
            <span>Frete{shippingEnabled && ship.option ? ` (${ship.option.name})` : ''}</span>
            <span>
              {coupon?.freeShipping ? (
                <span className="good">Grátis (cupom)</span>
              ) : shipping == null ? (
                <span className="muted">informe o CEP</span>
              ) : shipping ? formatPrice(shipping) : 'Grátis'}
            </span>
          </div>
          {couponDiscount > 0 && <div className="summary__row good"><span>Cupom {coupon.code}</span><span>−{formatPrice(couponDiscount)}</span></div>}
          {discount > 0 && <div className="summary__row good"><span>Desconto Pix</span><span>−{formatPrice(discount)}</span></div>}
          <div className="summary__row summary__total"><span>Total</span><span>{formatPrice(total)}</span></div>
          {error && <p className="alert">{error}</p>}
          <button className="btn btn--primary btn--block" disabled={sending}>
            {sending ? 'Enviando…' : 'Confirmar pedido'}
          </button>
        </aside>
      </form>
    </section>
  );
}
