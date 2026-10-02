import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProductArt from './ProductArt';
import AddToBag from './AddToBag';
import { productImage } from '../assets';
import { formatPrice } from '../brand';

const tints = ['tint-pink', 'tint-blue', 'tint-cream'];

export default function ProductCard({ product, index = 0 }) {
  const [adding, setAdding] = useState(false);
  // the colour dots under the card pick the colour: the photo follows, and so do the product page and the "+" sheet
  const [color, setColor] = useState(product.colors[0]);
  const href = `/produto/${product.slug}${color && color !== product.colors[0] ? `?cor=${encodeURIComponent(color.name)}` : ''}`;
  return (
    <div className="card">
      <Link to={href} className="card__link">
        <div className={`card__media ${tints[index % tints.length]}`}>
          {product.badge && <span className="badge">{product.badge}</span>}
          <ProductArt
            category={product.category}
            color={color?.hex}
            pattern={product.pattern}
            image={productImage(product, color)}
            alt={`${product.name}${color ? ` — ${color.name}` : ''}`}
          />
        </div>
        <div className="card__body">
          <h3 className="card__title">{product.name}</h3>
          <div className="card__row">
            <span className="price">{formatPrice(product.price)}</span>
          </div>
        </div>
      </Link>
      {product.colors.length > 1 && (
        <div className="swatches card__swatches" role="group" aria-label={`Cores de ${product.name}`}>
          {product.colors.map((c) => (
            <button
              key={c.hex}
              type="button"
              className={`swatch swatch--sm ${color?.hex === c.hex ? 'swatch--on' : ''}`}
              style={{ background: c.hex }}
              title={c.name}
              aria-label={c.name}
              aria-pressed={color?.hex === c.hex}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      )}
      {product.stock > 0 && (
        <button type="button" className="card__add" onClick={() => setAdding(true)} aria-label={`Adicionar ${product.name} à sacola`} title="Adicionar à sacola">
          +
        </button>
      )}
      <AnimatePresence>{adding && <AddToBag product={product} initialColor={color} onClose={() => setAdding(false)} />}</AnimatePresence>
    </div>
  );
}
