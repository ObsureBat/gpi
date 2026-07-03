import { Link } from 'react-router-dom';
import { formatInr } from '../utils.js';

export function ProductCard({ product, onAdd, className = '', style = {} }) {
  const tag = product.brand === 'gtm' ? 'GTM' : 'GPI';
  const tagClass = product.brand === 'gtm' ? 'tag tag--gtm' : 'tag tag--gpi';

  return (
    <article className={`product-card${className ? ` ${className}` : ''}`} style={style}>
      <Link to={`/products/${product.handle}`} className="product-card__media">
        <img src={product.image_url} alt="" loading="lazy" />
        <span className={tagClass}>{tag}</span>
      </Link>
      <div className="product-card__body">
        <Link to={`/products/${product.handle}`}>
          <h3 className="product-card__title">{product.title}</h3>
        </Link>
        <div className="product-card__price">
          <span className="price-current">{formatInr(product.price_cents)}</span>
          {product.compare_at_cents && product.compare_at_cents > product.price_cents && (
            <span className="price-compare">{formatInr(product.compare_at_cents)}</span>
          )}
        </div>
        {onAdd && (
          <button type="button" className="btn btn--primary btn--small" onClick={() => onAdd(product.id)}>
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
