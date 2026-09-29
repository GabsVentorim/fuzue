import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { formatPrice } from '../brand';
import { useCart } from '../context/CartContext';
import { SIZES, sizeRange } from '../sizes';
import ProductArt from '../components/ProductArt';
import { productImage } from '../assets';
import ShippingCalculator from '../components/ShippingCalculator';
import ProductCard from '../components/ProductCard';
import { Truck, Shield } from '../components/Icons';

const sizeHelp = Object.fromEntries(SIZES.map((s) => [s.id, sizeRange(s)]));
const catName = { coleiras: 'Coleiras', bandanas: 'Bandanas', presilhas: 'Presilhas' };

export default function Product() {
  const { slug } = useParams();
  const { add, shippingEnabled, ship, setShipCep } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [color, setColor] = useState(null);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [warn, setWarn] = useState('');

  useEffect(() => {
    setProduct(null);
    setError('');
    api
      .product(slug)
      .then((p) => {
        setProduct(p);
        setColor(p.colors[0]);
        setSize('');
        setQty(1);
        return api.products({ category: p.category });
      })
      .then((list) => setRelated(list.filter((p) => p.slug !== slug).slice(0, 4)))
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <p className="alert container section">{error}</p>;
  if (!product) return <p className="muted center section">Carregando…</p>;

  const needsSize = product.sizes.length > 0;
  const soldOut = product.stock <= 0;

  const handleAdd = () => {
    if (needsSize && !size) return setWarn('Escolha um tamanho primeiro');
    setWarn('');
    add(product, { size, color, qty });
  };

  return (
    <section className="section container">
      <nav className="crumbs">
        <Link to="/loja">Loja</Link> / <Link to={`/loja?categoria=${product.category}`}>{catName[product.category]}</Link> /{' '}
        <span>{product.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp__media tint-pink">
          {product.badge && <span className="badge">{product.badge}</span>}
          <ProductArt
            category={product.category}
            color={color?.hex}
            pattern={product.pattern}
            image={productImage(product, color)}
            alt={`${product.name}${color ? ` — ${color.name}` : ''}`}
          />
        </div>

        <div className="pdp__info">
          <h1>{product.name}</h1>
          <p className="pdp__price">{formatPrice(product.price)}</p>
          <p className="muted">ou {formatPrice(product.price * 0.95)} no Pix</p>
          <p className="pdp__desc">{product.description}</p>

          <div className="opt">
            <span className="opt__label">
              Cor: <b>{color?.name}</b>
            </span>
            <div className="swatches">
              {product.colors.map((c) => (
                <button
                  key={c.hex}
                  className={`swatch ${color?.hex === c.hex ? 'swatch--on' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setColor(c)}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {needsSize && (
            <div className="opt">
              <span className="opt__label">
                Tamanho {size && sizeHelp[size] && <small className="muted">({sizeHelp[size]} de pescoço)</small>}
                <Link to="/guia-de-tamanhos" className="link small opt__help">Qual é o meu tamanho?</Link>
              </span>
              <div className="sizes">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    className={`size ${size === s ? 'size--on' : ''}`}
                    onClick={() => {
                      setSize(s);
                      setWarn('');
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {warn && <p className="warn">{warn}</p>}
            </div>
          )}

          <div className="buy">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Mais">+</button>
            </div>
            <button className="btn btn--primary btn--grow" onClick={handleAdd} disabled={soldOut}>
              {soldOut ? 'Esgotado' : 'Adicionar ao carrinho'}
            </button>
          </div>
          {product.stock > 0 && product.stock <= 10 && (
            <p className="warn">Corre! Só restam {product.stock} unidades.</p>
          )}

          {shippingEnabled && !soldOut && (
            <ShippingCalculator auto limit={3} items={[{ productId: product.id, qty }]} cep={ship.cep} onCepChange={setShipCep} />
          )}

          <ul className="pdp__perks">
            <li><Truck width={20} height={20} /> Frete grátis acima de R$ 150</li>
            <li><Shield width={20} height={20} /> Troca fácil de tamanho em até 30 dias</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <>
          <h2 className="section__title" style={{ marginTop: 64 }}>Combina com</h2>
          <div className="grid">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i + 1} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
