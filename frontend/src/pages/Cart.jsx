import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import brand, { formatPrice } from '../brand';
import ProductArt from '../components/ProductArt';
import { Paw, Trash } from '../components/Icons';
import ShippingCalculator from '../components/ShippingCalculator';

export default function Cart() {
  const { items, setQty, remove, subtotal, shipping, missingForFree, shippingEnabled, ship, setShipCep, chooseShipping } = useCart();

  if (items.length === 0) {
    return (
      <section className="section container empty">
        <Paw width={64} height={64} />
        <h1>Seu carrinho está vazio</h1>
        <p className="muted">Bora encher de fuzuê?</p>
        <Link to="/loja" className="btn btn--primary">Ir para a loja</Link>
      </section>
    );
  }

  const progress = Math.min(100, (subtotal / brand.shipping.freeFrom) * 100);

  return (
    <section className="section container">
      <h1 className="page-title">Seu carrinho</h1>

      <div className="free-ship">
        <p>
          {missingForFree > 0 ? (
            <>Faltam <b>{formatPrice(missingForFree)}</b> para o frete grátis</>
          ) : (
            <>Oba! Você ganhou <b>frete grátis</b></>
          )}
        </p>
        <div className="bar"><span style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="cart">
        <ul className="cart__list">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size}-${item.color}`} className="line">
              <Link to={`/produto/${item.slug}`} className="line__media tint-pink">
                <ProductArt category={item.category} color={item.colorHex} pattern={item.pattern} alt={item.name} />
              </Link>
              <div className="line__info">
                <Link to={`/produto/${item.slug}`} className="line__name">{item.name}</Link>
                <span className="muted">
                  {[item.color, item.size && `Tam. ${item.size}`].filter(Boolean).join(' · ')}
                </span>
                <div className="qty qty--sm">
                  <button onClick={() => setQty(item, item.qty - 1)} aria-label="Menos">−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => setQty(item, item.qty + 1)} aria-label="Mais">+</button>
                </div>
              </div>
              <div className="line__end">
                <span className="price">{formatPrice(item.price * item.qty)}</span>
                <button className="icon-btn" onClick={() => remove(item)} aria-label="Remover">
                  <Trash width={20} height={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="summary">
          <h2>Resumo</h2>
          <div className="summary__row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          {shippingEnabled && (
            <ShippingCalculator
              compact
              auto
              items={items.map(({ productId, qty }) => ({ productId, qty }))}
              cep={ship.cep}
              onCepChange={setShipCep}
              selectedId={ship.option?.id}
              onSelect={(o, q) => chooseShipping(o, q.cep)}
              onQuote={(q) => {
                // keep the chosen service in sync with the fresh price (or pick the cheapest)
                if (!q) return;
                const same = q.options.find((o) => o.id === ship.option?.id);
                chooseShipping(same || q.options[0], q.cep);
              }}
            />
          )}
          <div className="summary__row">
            <span>Frete{ship.option && shippingEnabled ? ` (${ship.option.name})` : ''}</span>
            <span>{shipping == null ? <span className="muted">calcule acima</span> : shipping ? formatPrice(shipping) : 'Grátis'}</span>
          </div>
          <div className="summary__row summary__total"><span>Total</span><span>{formatPrice(subtotal + (shipping || 0))}</span></div>
          <p className="muted small">5% de desconto pagando com Pix no próximo passo.</p>
          <Link to="/checkout" className="btn btn--primary btn--block">Finalizar compra</Link>
          <Link to="/loja" className="link center-block">Continuar comprando</Link>
        </aside>
      </div>
    </section>
  );
}
