import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { useCart } from '../contexts/CartContext.jsx';

export function CollectionPage() {
  const { handle } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    setData(null);
    api
      .getCollection(handle)
      .then(setData)
      .catch(() => setErr(true));
  }, [handle]);

  if (err) {
    return (
      <div className="page-width page-section">
        <p>Collection not found.</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-loading">
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="collection-hero page-width">
        <h1>{data.title}</h1>
        {data.description && <p className="collection-hero__desc">{data.description}</p>}
      </div>
      <div className="page-width product-grid">
        {data.products?.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={(id) => addToCart(id, 1)} />
        ))}
      </div>
      {data.products?.length === 0 && <p className="page-width">No products in this collection yet.</p>}
    </div>
  );
}
