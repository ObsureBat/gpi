import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { formatInr } from '../utils.js';

export function CartPage() {
  const { cart, loading, updateQty } = useCart();

  if (loading || !cart) {
    return (
      <div className="page-loading">
        <span className="spinner" />
      </div>
    );
  }

  const { items, subtotal_cents } = cart;

  return (
    <div className="page-width page-section cart-page">
      <h1>Cart</h1>
      {items.length === 0 ? (
        <p>
          Your cart is empty. <Link to="/collections/all">Continue shopping</Link>
        </p>
      ) : (
        <>
          <ul className="cart-list">
            {items.map((line) => (
              <li key={line.product_id} className="cart-line">
                <img src={line.image_url} alt="" width={96} height={96} />
                <div className="cart-line__info">
                  <Link to={`/products/${line.handle}`}>{line.title}</Link>
                  <p className="cart-line__price">{formatInr(line.price_cents)} each</p>
                </div>
                <div className="cart-line__qty">
                  <button
                    type="button"
                    aria-label="Decrease"
                    onClick={() => updateQty(line.product_id, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase"
                    onClick={() => updateQty(line.product_id, line.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <div className="cart-line__total">{formatInr(line.price_cents * line.quantity)}</div>
              </li>
            ))}
          </ul>
          <div className="cart-summary">
            <p>
              <strong>Subtotal</strong> {formatInr(subtotal_cents)}
            </p>
            <Link to="/checkout" className="btn btn--primary btn--large">
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
