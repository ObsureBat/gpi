import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useCart } from '../contexts/CartContext.jsx';
import { formatInr } from '../utils.js';
import { ProductCard } from '../components/ProductCard.jsx';

export function ProductPage() {
  const { handle } = useParams();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const [related, setRelated] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  const [userReviews, setUserReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    title: '',
    rating: 5,
    body: '',
  });
  const [reviewErr, setReviewErr] = useState(null);
  const [highlightReviewId, setHighlightReviewId] = useState(null);
  const [status, setStatus] = useState('ready');
  const carouselRef = useRef(null);

  useEffect(() => {
    api.getProduct(handle).then(setP).catch(() => setP(false));
    api.getProducts().then(setAllProducts).catch(() => setAllProducts([]));
  }, [handle]);

  const sizes = useMemo(() => {
    if (!p || !allProducts.length) return [];
    const baseTitle = p.title.replace(/\s\d+(g|kg|Kg).*$/i, '').trim();
    return allProducts
      .filter((x) => x.title.startsWith(baseTitle))
      .map((x) => {
        const match = x.title.match(/(\d+(g|kg|Kg))/i);
        return {
          id: x.id,
          handle: x.handle,
          size: match ? match[0] : 'Standard',
          price: x.price_cents,
        };
      })
      .sort((a, b) => {
        const val = (s) => {
          const m = s.match(/(\d+)(g|kg|Kg)/i);
          if (!m) return 0;
          return m[2].toLowerCase() === 'kg' ? Number(m[1]) * 1000 : Number(m[1]);
        };
        return val(a.size) - val(b.size);
      });
  }, [p, allProducts]);

  useEffect(() => {
    if (sizes.length > 0) {
      const current = sizes.find((s) => s.id === p?.id);
      setSelectedSize(current || sizes[0]);
    }
  }, [sizes, p]);

  useEffect(() => {
    if (!p || p === false) return undefined;
    api
      .getProducts('?brand=' + encodeURIComponent(p.brand))
      .then((rows) => rows.filter((x) => x.handle !== p.handle).slice(0, 8))
      .then(setRelated)
      .catch(() => setRelated([]));
    return undefined;
  }, [p]);

  useEffect(() => {
    if (!handle) return undefined;
    const key = `gpi_reviews:${handle}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setUserReviews(parsed);
    } catch {
      // Ignore storage issues (private mode, blocked storage, etc.)
    }
    return undefined;
  }, [handle]);

  useEffect(() => {
    if (!handle) return undefined;
    const key = `gpi_reviews:${handle}`;
    try {
      localStorage.setItem(key, JSON.stringify(userReviews));
    } catch {
      // Ignore storage issues
    }
    return undefined;
  }, [userReviews, handle]);

  const mockReviews = useMemo(() => {
    if (!p || p === false) return [];
    // Deterministic mock reviews from handle (no backend schema yet).
    const seed = Array.from(p.handle).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const names = ['Asha', 'Rohit', 'Meera', 'Kabir', 'Priya', 'Vikram', 'Nisha', 'Arjun'];
    const titles = ['Excellent quality', 'Perfect taste', 'Good value for money', 'Highly recommend', 'Great product'];
    const bodies = [
      'The product arrived well packed and looks exactly like the listing. Taste is spot on.',
      'What I liked most is the consistency—no surprises. Will reorder again.',
      'Really impressed with freshness and packaging quality. Makes my cooking easier.',
      'Nice aroma and flavor. One of the better options I tried recently.',
      'Overall a solid purchase. Works great for everyday use.',
    ];

    const starFrom = (i) => {
      const v = (seed + i * 7) % 20; // 0..19
      return v < 2 ? 2 : v < 6 ? 3 : v < 13 ? 4 : 5;
    };

    return Array.from({ length: 6 }).map((_, i) => {
      const id = `mock:${p.handle}:${i}`;
      return {
        id,
        name: names[(seed + i) % names.length],
        title: titles[(seed + i * 3) % titles.length],
        rating: starFrom(i),
        date: new Date(Date.now() - (i + 1) * 86400000 * 13).toISOString().slice(0, 10),
        body: bodies[(seed + i * 5) % bodies.length],
      };
    });
  }, [p]);

  const allReviews = useMemo(() => {
    return [...mockReviews, ...userReviews].slice(0, 20);
  }, [mockReviews, userReviews]);

  const ratingStats = useMemo(() => {
    const totals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allReviews) totals[r.rating] = (totals[r.rating] || 0) + 1;
    const count = allReviews.length || 1;
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / count;
    const dist = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: totals[s] }));
    return { avg, count: allReviews.length, dist };
  }, [allReviews]);

  const isBestSeller = useMemo(() => {
    if (!p || p === false) return false;
    // Deterministic best seller based on handle for professional look
    return p.handle.length % 3 === 0;
  }, [p]);

  const addToCartWithAnimation = async (id, quantity) => {
    try {
      // Only show global loading state if adding the main product
      const isMainProduct = id === p?.id;
      if (isMainProduct) setStatus('adding');

      await addToCart(id, quantity);

      if (isMainProduct) {
        // Wait for animation to finish before resetting state
        setTimeout(() => {
          setQty(1);
          setStatus('ready');
        }, 1500);
      }
    } catch {
      setStatus('ready');
    }
  };

  const onSubmitReview = (e) => {
    e.preventDefault();
    setReviewErr(null);

    const name = reviewForm.name.trim();
    const title = reviewForm.title.trim();
    const body = reviewForm.body.trim();
    const rating = Number(reviewForm.rating);

    if (!name || name.length < 2) return setReviewErr('Please enter your name.');
    if (!title || title.length < 3) return setReviewErr('Please add a short title.');
    if (!body || body.length < 20) return setReviewErr('Please write at least 20 characters.');
    if (Number.isNaN(rating) || rating < 1 || rating > 5) return setReviewErr('Rating must be between 1 and 5.');

    if (!handle) return undefined;

    const id = `user:${handle}:${Date.now()}`;
    const newReview = {
      id,
      name,
      title,
      rating,
      date: new Date().toISOString().slice(0, 10),
      body,
    };

    setUserReviews((prev) => [newReview, ...prev]);
    setHighlightReviewId(id);
    setReviewForm({ name: '', title: '', rating: 5, body: '' });
  };

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = 300;
    carouselRef.current.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  if (p === null) {
    return (
      <div className="page-loading">
        <span className="spinner" />
      </div>
    );
  }

  if (p === false) {
    return (
      <div className="page-width page-section">
        <p>Product not found.</p>
        <Link to="/collections/all">Browse shop</Link>
      </div>
    );
  }

  return (
    <div className="page-width page-section product-detail">
      <div className="product-detail__grid">
        <div className="product-detail__media reveal">
          <img src={p.image_url} alt={p.title} />
        </div>
        <div className="product-detail__info reveal">
          <div className="product-detail__meta">
            <span className={p.brand === 'gtm' ? 'tag tag--gtm' : 'tag tag--gpi'}>
              {p.brand === 'gtm' ? 'GTM' : 'GPI'}
            </span>
            {isBestSeller && <span className="product-detail__badge">Best Seller</span>}
          </div>
          <h1>{p.title}</h1>
          
          <div className="product-detail__rating-summary" onClick={() => document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' })}>
            <div className="stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < Math.round(ratingStats.avg) ? 'star star--on' : 'star'}>★</span>
              ))}
            </div>
            <span className="count">{ratingStats.count} Reviews</span>
          </div>

          <div className="product-detail__price">
            <span className="price-current">{formatInr(selectedSize?.price || p.price_cents)}</span>
            {p.compare_at_cents && p.compare_at_cents > p.price_cents && (
              <span className="price-compare">{formatInr(p.compare_at_cents)}</span>
            )}
          </div>

          <p className="product-detail__desc">{p.description}</p>

          {sizes.length > 1 && (
            <div className="product-detail__sizes">
              <label>Select Size</label>
              <div className="size-options">
                {sizes.map((s) => (
                  <Link
                    key={s.id}
                    to={`/products/${s.handle}`}
                    className={`size-option ${selectedSize?.id === s.id ? 'active' : ''}`}
                  >
                    {s.size}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="product-detail__buy">
            <div className="qty-selector">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
              <input
                type="number"
                min={1}
                max={99}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || 1)}
              />
              <button type="button" onClick={() => setQty(Math.min(99, qty + 1))}>+</button>
            </div>
            <button
               type="button"
               className={`btn btn--primary btn--add-to-cart ${status === 'adding' ? 'adding' : ''}`}
               onClick={() => addToCartWithAnimation(p.id, qty)}
               disabled={status === 'adding'}
             >
               <span className="btn-text">
                 {status === 'adding' ? 'Adding to cart...' : 'Add to cart'}
               </span>
               <span className="btn-icon">{status === 'adding' ? '✨' : '🛒'}</span>
             </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="product-extra product-extra--reco reveal">
          <div className="product-extra__panel">
            <header className="product-extra__head reveal">
              <h2>Recommended for you</h2>
              <p>Similar {p.brand.toUpperCase()} picks you may like.</p>
            </header>
            <div className="product-reco__carousel-wrapper">
              <button
                className="carousel-nav carousel-nav--prev"
                onClick={() => scrollCarousel('prev')}
                aria-label="Previous products"
              >
                ←
              </button>
              <div className="product-reco__carousel" ref={carouselRef}>
                {related.map((rp, idx) => (
                  <ProductCard
                    key={rp.id}
                    product={rp}
                    onAdd={(id) => addToCartWithAnimation(id, 1)}
                    className="carousel-item reveal"
                    style={{ '--i': idx }}
                  />
                ))}
              </div>
              <button
                className="carousel-nav carousel-nav--next"
                onClick={() => scrollCarousel('next')}
                aria-label="Next products"
              >
                →
              </button>
            </div>
          </div>
        </section>
      )}

      <section id="reviews" className="product-extra product-extra--reviews reveal">
        <div className="product-extra__panel">
          <header className="product-extra__head reveal">
            <h2>Customer reviews</h2>
            <p>Real feedback to help you choose with confidence.</p>
          </header>

          <div className="reviews-summary">
            <div className="reviews-summary__left">
              <div className="reviews-rating">
                <div className="reviews-rating__avg" aria-label={`Average rating ${ratingStats.avg.toFixed(1)} out of 5`}>
                  {ratingStats.avg.toFixed(1)}
                </div>
                <div className="reviews-rating__stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(ratingStats.avg) ? 'star star--on' : 'star'}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="reviews-count">
                {ratingStats.count} review{ratingStats.count === 1 ? '' : 's'}
              </p>
            </div>

            <div className="reviews-summary__right">
              <div className="rating-dist">
                {ratingStats.dist.map((d) => {
                  const percent = ratingStats.count ? (d.count / ratingStats.count) * 100 : 0;
                  return (
                    <div key={d.stars} className="rating-dist__row">
                      <span className="rating-dist__label">{d.stars}★</span>
                      <span className="rating-dist__bar" aria-hidden="true">
                        <span className="rating-dist__fill" style={{ width: `${percent}%` }} />
                      </span>
                      <span className="rating-dist__count">{d.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="reviews-content">
            <div className="reviews-list">
              {allReviews.length === 0 ? (
                <p className="reviews-empty">Be the first to review this product.</p>
              ) : (
                allReviews.map((r, idx) => (
                  <article
                    key={r.id}
                    className={`review-card reveal reveal--stagger${r.id === highlightReviewId ? ' review-card--new' : ''}`}
                    style={{ '--stagger': idx }}
                  >
                    <div className="review-card__top">
                      <div className="review-card__meta">
                        <strong>{r.title}</strong>
                        <span className="review-card__by">by {r.name}</span>
                      </div>
                      <div className="review-card__stars" aria-label={`${r.rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < r.rating ? 'star star--on' : 'star'} aria-hidden="true">
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="review-card__date">{r.date}</div>
                    <p className="review-card__body">{r.body}</p>
                  </article>
                ))
              )}
            </div>

            <form className="review-form" onSubmit={onSubmitReview}>
              <h3>Write a review</h3>

              <label>
                Your name
                <input
                  className="input"
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>

              <label>
                Title
                <input
                  className="input"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>

              <label>
                Rating
                <select
                  className="input"
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Review
                <textarea
                  className="input"
                  rows={5}
                  value={reviewForm.body}
                  onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                />
              </label>

              {reviewErr && <p className="form-error">{reviewErr}</p>}

              <button type="submit" className="btn btn--primary btn--large">
                Submit review
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
