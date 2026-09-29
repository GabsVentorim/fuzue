import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import brand, { formatPrice, whatsappLink } from '../brand';
import { Heart } from '../components/Icons';

const payLabel = { pix: 'Pix', cartao: 'Cartão', boleto: 'Boleto' };

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.order(id).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="alert container section">{error}</p>;
  if (!order) return <p className="muted center section">Carregando…</p>;

  return (
    <section className="section container success">
      <div className="success__icon"><Heart width={48} height={48} /></div>
      <h1>Pedido feito! Valeu pelo carinho</h1>
      <p className="muted">
        Número do pedido: <b>{order.id}</b>. Guarde esse número — vamos te chamar no WhatsApp para combinar o pagamento.
      </p>

      <div className="summary success__box">
        {order.items.map((i, idx) => (
          <div key={idx} className="summary__row small">
            <span>{i.qty}× {i.name}{i.size ? ` (${i.size})` : ''}{i.color ? ` · ${i.color}` : ''}</span>
            <span>{formatPrice(i.total)}</span>
          </div>
        ))}
        <hr />
        <div className="summary__row">
          <span>Frete{order.shippingInfo ? ` · ${order.shippingInfo.name} (até ${order.shippingInfo.days?.max} ${order.shippingInfo.days?.max > 1 ? 'dias úteis' : 'dia útil'})` : ''}</span>
          <span>{order.shipping ? formatPrice(order.shipping) : 'Grátis'}</span>
        </div>
        {order.couponDiscount > 0 && (
          <div className="summary__row good"><span>Cupom {order.couponCode}</span><span>−{formatPrice(order.couponDiscount)}</span></div>
        )}
        {order.discount > 0 && <div className="summary__row good"><span>Desconto Pix</span><span>−{formatPrice(order.discount)}</span></div>}
        <div className="summary__row"><span>Pagamento</span><span>{payLabel[order.payment]}</span></div>
        <div className="summary__row summary__total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
      </div>

      <div className="hero__cta center">
        <a className="btn btn--primary" href={whatsappLink(`Oi, ${brand.name}! Acabei de fazer o pedido ${order.id}.`)} target="_blank" rel="noreferrer">
          Falar no WhatsApp
        </a>
        <Link to="/loja" className="btn btn--ghost">Voltar para a loja</Link>
      </div>
    </section>
  );
}
