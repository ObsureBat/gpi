import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Hero backgrounds must be reachable by the browser:
 * - Put files in client/public/hero/ and use paths starting with /hero/...
 * - Or use full URLs (https://...)
 * Plain filenames like "photo.png" will NOT work — they are not served by Vite.
 */
const GTM_BACKGROUND_IMAGE = '/hero/gtm-hero.png';
const GPI_BACKGROUND_IMAGE = '/hero/gpi-hero.png';

function PlaceholderGtm() {
  return (
    <div className="brand-split__placeholder brand-split__placeholder--gtm" aria-hidden="true">
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bs-ph-gtm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="50%" stopColor="#fbcfe8" />
            <stop offset="100%" stopColor="#f9a8d4" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#bs-ph-gtm)" />
        <circle cx="280" cy="120" r="90" fill="none" stroke="rgba(190,24,93,0.2)" strokeWidth="1" />
        <text x="200" y="210" textAnchor="middle" fill="rgba(157,23,77,0.35)" fontSize="14" fontFamily="system-ui">
          GTM image
        </text>
      </svg>
    </div>
  );
}

function PlaceholderGpi() {
  return (
    <div className="brand-split__placeholder brand-split__placeholder--gpi" aria-hidden="true">
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bs-ph-gpi" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="45%" stopColor="#ffedd5" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#bs-ph-gpi)" />
        <rect
          x="100"
          y="100"
          width="200"
          height="200"
          fill="none"
          stroke="rgba(194,65,12,0.2)"
          strokeWidth="1"
          transform="rotate(12 200 200)"
        />
        <text x="200" y="210" textAnchor="middle" fill="rgba(154,52,18,0.35)" fontSize="14" fontFamily="system-ui">
          GPI image
        </text>
      </svg>
    </div>
  );
}

export function SplitHero() {
  const rootRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      className={`brand-split${visible ? ' brand-split--visible' : ''}`}
      aria-label="GTM and GPI brand showcase"
    >
      <div className="brand-split__container">
        <Link className="brand-split__panel brand-split__panel--left" to="/collections/gtm-products">
          {GTM_BACKGROUND_IMAGE ? (
            <img className="brand-split__bg" src={GTM_BACKGROUND_IMAGE} alt="" loading="eager" decoding="async" />
          ) : (
            <PlaceholderGtm />
          )}
          <div className="brand-split__overlay brand-split__overlay--gtm" aria-hidden="true" />
          <div className="brand-split__panel-dim" aria-hidden="true" />
          <div className="brand-split__content">
            <div className="brand-split__logo brand-split__logo--float">
              <span className="brand-split__logo-text">GTM</span>
            </div>
            <h2 className="brand-split__title">Himalayan salt &amp; minerals</h2>
            <p className="brand-split__desc">
              Premium Himalayan salts — pink, black, and rock — carefully sourced and packed for natural minerals and
              authentic taste.
            </p>
            <span className="brand-split__cta brand-split__cta--gtm">
              <span className="brand-split__cta-inner">Shop GTM products</span>
            </span>
          </div>
        </Link>

        <Link className="brand-split__panel brand-split__panel--right" to="/collections/gpi-products">
          {GPI_BACKGROUND_IMAGE ? (
            <img className="brand-split__bg" src={GPI_BACKGROUND_IMAGE} alt="" loading="eager" decoding="async" />
          ) : (
            <PlaceholderGpi />
          )}
          <div className="brand-split__overlay brand-split__overlay--gpi" aria-hidden="true" />
          <div className="brand-split__panel-dim" aria-hidden="true" />
          <div className="brand-split__content">
            <div className="brand-split__logo brand-split__logo--float">
              <span className="brand-split__logo-text">GPI</span>
            </div>
            <h2 className="brand-split__title">Masalas, spices &amp; home care</h2>
            <p className="brand-split__desc">
              Authentic spices, masalas, detergents, and natural salts — trusted quality and modern manufacturing for
              everyday kitchens.
            </p>
            <span className="brand-split__cta brand-split__cta--gpi">
              <span className="brand-split__cta-inner">Shop GPI products</span>
            </span>
          </div>
        </Link>

        <div className="brand-split__divider" aria-hidden="true" />
      </div>
    </section>
  );
}
