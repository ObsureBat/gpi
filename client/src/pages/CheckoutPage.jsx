import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useCart } from '../contexts/CartContext.jsx';
import { formatInr } from '../utils.js';

export function CheckoutPage() {
  const { cart, loading, refresh } = useCart();
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
  });
  const [done, setDone] = useState(null);
  const [err, setErr] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      const res = await api.checkout(form);
      setDone(res);
      await refresh();
    } catch (ex) {
      setErr(ex.message || 'Checkout failed');
    }
  };

  if (loading || !cart) {
    return (
      <div className="page-loading">
        <span className="spinner" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="page-width page-section">
        <p>Your cart is empty.</p>
        <Link to="/cart">Back to cart</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page-width page-section checkout-success">
        <h1>Thank you!</h1>
        <p>
          Order <strong>#{done.order_id}</strong> placed. Total {formatInr(done.total_cents)}.
        </p>
        <p className="checkout-success__note">
          This demo records orders in your local SQLite database. Connect a payment gateway for production.
        </p>
        <Link to="/" className="btn btn--primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="page-width page-section checkout">
      <h1>Checkout</h1>
      <div className="checkout__grid">
        <form className="checkout__form" onSubmit={submit}>
          <h2>Shipping</h2>
          <label>
            Email *
            <input name="email" type="email" required value={form.email} onChange={onChange} />
          </label>
          <label>
            Full name *
            <input name="full_name" required value={form.full_name} onChange={onChange} />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={onChange} />
          </label>
          <label>
            Address line 1 *
            <input name="address_line1" required value={form.address_line1} onChange={onChange} />
          </label>
          <label>
            Address line 2
            <input name="address_line2" value={form.address_line2} onChange={onChange} />
          </label>
          <div className="checkout__row">
            <label>
              City *
              <input name="city" required value={form.city} onChange={onChange} />
            </label>
            <label>
              State
              <input name="state" value={form.state} onChange={onChange} />
            </label>
          </div>
          <div className="checkout__row">
            <label>
              PIN code *
              <input name="postal_code" required value={form.postal_code} onChange={onChange} />
            </label>
            <label>
              Country
              <input name="country" value={form.country} onChange={onChange} />
            </label>
          </div>
          {err && <p className="form-error">{err}</p>}
          <button type="submit" className="btn btn--primary btn--large">
            Place order
          </button>
        </form>
        <aside className="checkout__summary">
          <h2>Order summary</h2>
          <ul>
            {cart.items.map((i) => (
              <li key={i.product_id}>
                {i.quantity}× {i.title} — {formatInr(i.price_cents * i.quantity)}
              </li>
            ))}
          </ul>
          <p className="checkout__total">
            <strong>Total</strong> {formatInr(cart.subtotal_cents)}
          </p>
        </aside>
      </div>
    </div>
  );
}
