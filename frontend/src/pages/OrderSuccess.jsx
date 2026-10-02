import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import brand, { formatPrice, whatsappLink } from '../brand';
import OrderCelebration from '../components/OrderCelebration';

const payLabel = { pix: 'Pix', cartao: 'Cartão', boleto: 'Boleto' };

// The order's journey. Each step is done once the order reaches that status.
const STEPS = [
  { label: 'Pedido recebido', from: ['aguardando_pagamento', 'pago', 'enviado', 'entregue'] },
  { label: 'Pagamento confirmado', from: ['pago', 'enviado', 'entregue'] },
  { label: 'Enviado', from: ['enviado', 'entregue'] },
  { label: 'Entregue', from: ['entregue'] },
];

function Seal() {
  return (
    <svg className="seal" viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="56" className="seal__disc" />
      <path d="M36 62 L53 78 L86 44" className="seal__check" pathLength="1" />
    </svg>
  );
}

function CopyId({ id }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the number is still on screen */
    }
  };
  return (
    <button type="button" className={`order-id ${copied ? 'order-id--copied' : ''}`} onClick={copy} title="Copiar número do pedido">
      <span className="order-id__label">Pedido</span>
      <b>{id}</b>
      <span className="order-id__action" aria-live="polite">{copied ? 'Copiado!' : 'Copiar'}</span>
    </button>
  );
}

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  // play the "order placed" animation only right after checkout (not on refresh / later visits)
  const [celebrate, setCelebrate] = useState(!!location.state?.celebrate);
  const endCelebration = () => {
    setCelebrate(false);
    navigate(location.pathname, { replace: true, state: {} });
  };

  useEffect(() => {
    api.order(id).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  if (celebrate) return <OrderCelebration onDone={endCelebration} />;
  if (error) return <p className="alert container section">{error}</p>;
  if (!order) return <p className="muted center section">Carregando…</p>;

  const cancelled = order.status === 'cancelado';
  const current = STEPS.findIndex((s) => !s.from.includes(order.status)); // first step not reached yet

  return (
    <section className="section container done">
      <header className="done__head">
        <Seal />
        <h1 className="done__title">{cancelled ? 'Pedido cancelado' : 'Pedido confirmado!'}</h1>
        <p className="done__lead">
          {cancelled
            ? 'Este pedido foi cancelado. Qualquer dúvida, fale com a gente no WhatsApp.'
            : 'Valeu pelo carinho! Vamos te chamar no WhatsApp para combinar o pagamento.'}
        </p>
        <CopyId id={order.id} />
      </header>

      {!cancelled && (
        <ol className="journey" aria-label="Andamento do pedido">
          {STEPS.map((s, i) => {
            const state = current === -1 || i < current ? 'done' : i === current ? 'now' : 'next';
            return (
              <li key={s.label} className={`journey__step journey__step--${state}`} style={{ '--i': i }}>
                <span className="journey__dot" aria-hidden />
                <span className="journey__label">{s.label}</span>
                <span className="sr-only">{state === 'done' ? '(concluído)' : state === 'now' ? '(próximo passo)' : ''}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="receipt">
        <div className="receipt__paper">
          <p className="receipt__brand">{brand.name} · recibo</p>
          {order.items.map((i, idx) => (
            <div key={idx} className="receipt__row" style={{ '--i': idx }}>
              <span>{i.qty}× {i.name}{i.size ? ` (${i.size})` : ''}{i.color ? ` · ${i.color}` : ''}</span>
              <span>{formatPrice(i.total)}</span>
            </div>
          ))}
          <div className="receipt__rule" />
          <div className="receipt__row">
            <span>Frete{order.shippingInfo ? ` · ${order.shippingInfo.name} (até ${order.shippingInfo.days?.max} ${order.shippingInfo.days?.max > 1 ? 'dias úteis' : 'dia útil'})` : ''}</span>
            <span>{order.shipping ? formatPrice(order.shipping) : 'Grátis'}</span>
          </div>
          {order.couponDiscount > 0 && (
            <div className="receipt__row receipt__row--good"><span>Cupom {order.couponCode}</span><span>−{formatPrice(order.couponDiscount)}</span></div>
          )}
          {order.discount > 0 && <div className="receipt__row receipt__row--good"><span>Desconto Pix</span><span>−{formatPrice(order.discount)}</span></div>}
          <div className="receipt__row"><span>Pagamento</span><span>{payLabel[order.payment]}</span></div>
          <div className="receipt__rule" />
          <div className="receipt__row receipt__total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      <div className="done__cta">
        <a className="btn btn--primary" href={whatsappLink(`Oi, ${brand.name}! Acabei de fazer o pedido ${order.id}.`)} target="_blank" rel="noreferrer">
          Falar no WhatsApp
        </a>
        <Link to="/loja" className="btn btn--ghost">Voltar para a loja</Link>
      </div>
    </section>
  );
}
