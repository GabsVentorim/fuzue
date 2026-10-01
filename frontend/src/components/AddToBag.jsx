import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { formatPrice } from '../brand';
import { useCart } from '../context/CartContext';
import { productImage } from '../assets';
import { defaultSize, SIZES, sizeRange } from '../sizes';
import ProductArt from './ProductArt';
import { Close } from './Icons';

const sizeHelp = Object.fromEntries(SIZES.map((s) => [s.id, sizeRange(s)]));

// The "+" on a product card: a sheet that slides up from the bottom to pick colour, size and
// quantity, then drops the item in the bag without leaving the page. Rendered in <body> (portal): the card
// it opens from has transforms, which would otherwise trap a position: fixed sheet inside the card.
export default function AddToBag({ product, onClose }) {
  const { add } = useCart();
  const dialogRef = useRef(null);
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(() => defaultSize(product.sizes));
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;

  // close on Esc, lock page scroll, focus the sheet (once — onClose may be a new function every render)
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

  const submit = () => {
    add(product, { size, color, qty });
    onClose();
  };

  return createPortal(
    <div className="sheet" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="atb-title" tabIndex={-1} ref={dialogRef}>
        <div className="sheet__head">
          <h2 id="atb-title">Adicionar produto</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar"><Close /></button>
        </div>

        <div className="sheet__body">
          <div className="sheet__media tint-pink">
            <ProductArt category={product.category} color={color?.hex} pattern={product.pattern}
              image={productImage(product, color)} alt={`${product.name}${color ? ` — ${color.name}` : ''}`} />
          </div>
          <Link to={`/produto/${product.slug}`} className="sheet__full" onClick={onClose}>Ver página completa</Link>
          <h3 className="sheet__name">{product.name}</h3>

          {product.colors.length > 1 && (
            <div className="opt">
              <span className="opt__label">Cor: <b>{color?.name}</b></span>
              <div className="swatches">
                {product.colors.map((c) => (
                  <button key={c.hex} type="button" className={`swatch ${color?.hex === c.hex ? 'swatch--on' : ''}`}
                    style={{ background: c.hex }} onClick={() => setColor(c)} aria-label={c.name} />
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="opt">
              <span className="opt__label">
                Tamanho {sizeHelp[size] && <small className="muted">({sizeHelp[size]} de pescoço)</small>}
                {product.category !== 'presilhas' && (
                  <Link to="/guia-de-tamanhos" className="link small opt__help" onClick={onClose}>Qual é o meu tamanho?</Link>
                )}
              </span>
              <div className="sizes">
                {product.sizes.map((s) => (
                  <button key={s} type="button" className={`size ${size === s ? 'size--on' : ''}`} onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="sheet__qty">
            <span className="opt__label">Quantidade</span>
            <div className="qty">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos" disabled={qty <= 1}>−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Mais" disabled={qty >= product.stock}>+</button>
            </div>
          </div>
        </div>

        <div className="sheet__foot">
          <div className="sheet__price">
            <b>{formatPrice(product.price * qty)}</b>
            <small className="muted">ou {formatPrice(product.price * qty * 0.95)} no Pix</small>
          </div>
          <button type="button" className="btn btn--primary btn--block" onClick={submit} disabled={soldOut}>
            {soldOut ? 'Esgotado' : 'Adicionar à sacola'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
