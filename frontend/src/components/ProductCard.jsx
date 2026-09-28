import { Link } from 'react-router-dom';
import ProductArt from './ProductArt';
import { formatPrice } from '../brand';

const tints = ['tint-pink', 'tint-blue', 'tint-cream'];

export default function ProductCard({ product, index = 0 }) {
  const color = product.colors[0];
  return (
    <Link to={`/produto/${product.slug}`} className="card">
      <div className={`card__media ${tints[index % tints.length]}`}>
        {product.badge && <span className="badge">{product.badge}</span>}
        <ProductArt
          category={product.category}
          color={color?.hex}
          pattern={product.pattern}
          image={product.image}
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
  );
}
