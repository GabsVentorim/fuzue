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
  const color = product.colors[0];
  return (
    <div className="card">
      <Link to={`/produto/${product.slug}`} className="card__link">
        <div className={`card__media ${tints[index % tints.length]}`}>
          {product.badge && <span className="badge">{product.badge}</span>}
          <ProductArt
            category={product.category}
            color={color?.hex}
            pattern={product.pattern}
            image={productImage(product)}
            alt={product.name}
          />
        </div>
        <div className="card__body">
          <h3 className="card__title">{product.name}</h3>
          <div className="card__row">
            <span className="price">{formatPrice(product.price)}</span>
            <span className="swatches">
              {product.colors.map((c) => (
                <span key={c.hex} className="swatch swatch--sm" style={{ background: c.hex }} title={c.name} />
              ))}
            </span>
          </div>
        </div>
      </Link>
      {product.stock > 0 && (
        <button type="button" className="card__add" onClick={() => setAdding(true)} aria-label={`Adicionar ${product.name} à sacola`} title="Adicionar à sacola">
          +
        </button>
      )}
      <AnimatePresence>{adding && <AddToBag product={product} onClose={() => setAdding(false)} />}</AnimatePresence>
    </div>
  );
}
