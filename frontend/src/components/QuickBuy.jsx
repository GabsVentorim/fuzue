import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api';
import brand, { formatPrice } from '../brand';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { lookupCep } from '../cep';
import { isValidCpf } from '../cpf';
import { productImage } from '../assets';
import { defaultSize } from '../sizes';
import ProductArt from './ProductArt';
import CpfInput from './CpfInput';
import ShippingCalculator, { maskCep } from './ShippingCalculator';
import { Close, Ticket } from './Icons';

const PAYMENTS = [
  { id: 'pix', label: 'Pix', hint: '5% de desconto' },
  { id: 'cartao', label: 'Cartão', hint: 'até 3x sem juros' },
  { id: 'boleto', label: 'Boleto', hint: 'vence em 3 dias' },
];
const EMPTY = { name: '', email: '', phone: '', cpf: '', cep: '', address: '', number: '', complement: '', city: '', state: '' };
const round2 = (n) => Math.round(n * 100) / 100;

// "Comprar agora": a one-product checkout in a modal. It doesn't touch the cart.
// Same rules as the checkout page — the server re-prices everything when the order is placed.
export default function QuickBuy({ product, initial, onClose }) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { shippingEnabled, ship } = useCart();
  const dialogRef = useRef(null);

  // the item (editable here)
  const [color, setColor] = useState(initial.color || product.colors[0]);
  const [size, setSize] = useState(initial.size || defaultSize(product.sizes));
  const [qty, setQty] = useState(initial.qty || 1);

  // customer, delivery, payment
  const [form, setForm] = useState(() => ({ ...EMPTY, cep: maskCep(ship.cep) }));
  const [payment, setPayment] = useState('pix');
  const [shipOption, setShipOption] = useState(null);

  // coupon (the server's answer)
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const needsSize = product.sizes.length > 0;
  const subtotal = round2(product.price * qty);
  const items = [{ productId: product.id, qty }];
  const cepDigits = form.cep.replace(/\D/g, '');

  // close on Esc, lock page scroll, focus the dialog (once — onClose may be a new function every render)
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  // logged in: fill in contact info and the default saved address
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone, cpf: user.cpf || f.cpf }));
    api.addresses().then((list) => {
      const a = list.find((x) => x.isDefault) || list[0];
      if (a) setForm((f) => ({ ...f, cep: a.cep, address: a.address, number: a.number, complement: a.complement, city: a.city, state: a.state }));
    }).catch(() => {});
  }, [user]);

  // the coupon depends on the subtotal — re-check it when the quantity changes
  useEffect(() => {
    if (!coupon) return;
    api.validateCoupon(coupon.code, items, user?.cpf || form.cpf).then(setCoupon).catch((err) => {
      setCoupon(null);
      setCouponError(err.message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const fillFromCep = async () => {
    const r = await lookupCep(form.cep);
    if (r) setForm((f) => ({ ...f, address: r.address || f.address, city: r.city, state: r.state }));
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return setCouponError('Digite o código do cupom.');
    setCouponError('');
    try {
      setCoupon(await api.validateCoupon(couponInput, items, user?.cpf || form.cpf));
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message);
    }
  };

  // totals — same rules as the server
  const { fee, freeFrom } = brand.shipping;
  const baseShipping = shippingEnabled ? shipOption?.price ?? null : subtotal >= freeFrom ? 0 : fee;
  const shipping = coupon?.freeShipping ? 0 : baseShipping;
  const couponDiscount = coupon?.discount || 0;
  const pix = payment === 'pix' ? round2((subtotal - couponDiscount) * 0.05) : 0;
  const total = round2(subtotal - couponDiscount + (shipping || 0) - pix);

  const submit = async (e) => {
    e.preventDefault();
    if (needsSize && !size) return setError('Escolha o tamanho.');
    if (!isValidCpf(user?.cpf || form.cpf)) return setError('Confira o CPF — ele está inválido.');
    if (shippingEnabled && !shipOption) return setError('Escolha uma opção de entrega.');
    setSending(true);
    setError('');
    try {
      const order = await api.createOrder({
        customer: form,
        payment,
        shippingService: shipOption?.id,
        couponCode: coupon?.code,
        items: [{ productId: product.id, qty, size: size || null, color: color?.name }],
      });
      if (user && !user.cpf) setUser({ ...user, cpf: form.cpf });
      onClose();
      navigate(`/pedido/${order.id}`, { state: { celebrate: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.form
        className="modal__dialog qb" role="dialog" aria-modal="true" aria-labelledby="qb-title" tabIndex={-1} ref={dialogRef} onSubmit={submit}
        initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
      >
        <header className="modal__head">
          <h2 id="qb-title">Comprar agora</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar"><Close /></button>
        </header>

        <div className="qb__body">
          <div className="qb__main">
            {/* 1. the item */}
            <section className="qb__section">
              <h3>Seu item</h3>
              <div className="qb__item">
                <div className="qb__thumb tint-pink">
                  <ProductArt category={product.category} color={color?.hex} pattern={product.pattern} image={productImage(product, color)} alt={product.name} />
                </div>
                <div className="qb__item-info">
                  <b>{product.name}</b>
                  <span className="muted small">{formatPrice(product.price)} cada</span>
                  <div className="qb__opts">
                    <div className="swatches" aria-label="Cor">
                      {product.colors.map((c) => (
                        <button type="button" key={c.hex} title={c.name} aria-label={c.name}
                          className={`swatch ${color?.hex === c.hex ? 'swatch--on' : ''}`} style={{ background: c.hex }} onClick={() => setColor(c)} />
                      ))}
                    </div>
                    {needsSize && (
                      <div className="sizes sizes--sm" aria-label="Tamanho">
                        {product.sizes.map((s) => (
                          <button type="button" key={s} className={`size size--sm ${size === s ? 'size--on' : ''}`} onClick={() => { setSize(s); setError(''); }}>{s}</button>
                        ))}
                      </div>
                    )}
                    <div className="qty qty--sm">
                      <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos">−</button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Mais">+</button>
                    </div>
                  </div>
                  <small className="muted">Cor: {color?.name}{needsSize && ` · Tamanho: ${size || '— escolha'}`}</small>
                </div>
              </div>
            </section>

            {/* 2. customer */}
            <section className="qb__section qb__grid">
              <h3>Seus dados</h3>
              <label className="field field--full">Nome completo<input className="input" required autoComplete="name" value={form.name} onChange={set('name')} /></label>
              <label className="field">E-mail<input className="input" type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></label>
              <label className="field">WhatsApp<input className="input" type="tel" required placeholder="(11) 99999-9999" value={form.phone} onChange={set('phone')} /></label>
              <CpfInput
                value={user?.cpf || form.cpf}
                onChange={(cpf) => { setForm((f) => ({ ...f, cpf })); setCoupon(null); }}
                locked={!!user?.cpf}
                className="field field--full"
              />
            </section>

            {/* 3. delivery */}
            <section className="qb__section qb__grid">
              <h3>Entrega</h3>
              <label className="field">CEP<input className="input" required placeholder="00000-000" value={form.cep}
                onChange={(e) => setForm({ ...form, cep: maskCep(e.target.value) })} onBlur={fillFromCep} /></label>
              <label className="field">Número<input className="input" required value={form.number} onChange={set('number')} /></label>
              <label className="field field--full">Rua<input className="input" required value={form.address} onChange={set('address')} /></label>
              <label className="field">Complemento<input className="input" value={form.complement} onChange={set('complement')} /></label>
              <label className="field">Cidade / UF
                <span className="row row--tight">
                  <input className="input" required value={form.city} onChange={set('city')} aria-label="Cidade" />
                  <input className="input qb__uf" required maxLength={2} value={form.state} onChange={set('state')} aria-label="Estado" />
                </span>
              </label>
              {shippingEnabled && (
                <div className="field--full">
                  {cepDigits.length === 8 ? (
                    <ShippingCalculator
                      hideInput
                      auto
                      items={items}
                      cep={form.cep}
                      selectedId={shipOption?.id}
                      onSelect={(o) => { setShipOption(o); setError(''); }}
                      onQuote={(q) => setShipOption((cur) => (q ? q.options.find((o) => o.id === cur?.id) || q.options[0] : null))}
                    />
                  ) : (
                    <p className="muted small">Digite o CEP para ver as opções de frete.</p>
                  )}
                </div>
              )}
            </section>

            {/* 4. payment + coupon */}
            <section className="qb__section">
              <h3>Pagamento</h3>
              <div className="pay">
                {PAYMENTS.map((p) => (
                  <label key={p.id} className={`pay__opt ${payment === p.id ? 'pay__opt--on' : ''}`}>
                    <input type="radio" name="qb-payment" value={p.id} checked={payment === p.id} onChange={() => setPayment(p.id)} />
                    <strong>{p.label}</strong>
                    <small>{p.hint}</small>
                  </label>
                ))}
              </div>
              <div className="coupon">
                <span className="coupon__title"><Ticket width={18} height={18} /> Cupom de desconto</span>
                {coupon ? (
                  <div className="coupon__applied">
                    <span><b>{coupon.code}</b><small>{coupon.label}{couponDiscount > 0 && ` · −${formatPrice(couponDiscount)}`}</small></span>
                    <button type="button" className="link link--danger" onClick={() => setCoupon(null)}>remover</button>
                  </div>
                ) : (
                  <div className="coupon__row">
                    <input className="input" placeholder="Digite o código" value={couponInput} aria-label="Código do cupom"
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }} />
                    <button type="button" className="btn btn--ghost btn--sm" onClick={applyCoupon}>Aplicar</button>
                  </div>
                )}
                {couponError && <p className="alert small">{couponError}</p>}
              </div>
            </section>
          </div>

          {/* summary */}
          <aside className="qb__summary">
            <h3>Resumo</h3>
            <div className="summary__row small"><span>{qty}× {product.name}{size ? ` (${size})` : ''}</span><span>{formatPrice(subtotal)}</span></div>
            <hr />
            <div className="summary__row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary__row">
              <span>Frete{shipOption && !coupon?.freeShipping ? ` (${shipOption.name})` : ''}</span>
              <span>
                {coupon?.freeShipping ? <span className="good">Grátis (cupom)</span>
                  : shipping == null ? <span className="muted">informe o CEP</span>
                  : shipping ? formatPrice(shipping) : 'Grátis'}
              </span>
            </div>
            {couponDiscount > 0 && <div className="summary__row good"><span>Cupom {coupon.code}</span><span>−{formatPrice(couponDiscount)}</span></div>}
            {pix > 0 && <div className="summary__row good"><span>Desconto Pix</span><span>−{formatPrice(pix)}</span></div>}
            <div className="summary__row summary__total"><span>Total</span><span>{formatPrice(total)}</span></div>
            {error && <p className="alert small">{error}</p>}
            <button className="btn btn--primary btn--block" disabled={sending}>{sending ? 'Enviando…' : 'Finalizar compra'}</button>
            <p className="muted small center">Você pode editar qualquer coisa aqui antes de finalizar.</p>
          </aside>
        </div>
      </motion.form>
    </motion.div>
  );
}
