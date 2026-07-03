import { Link } from 'react-router-dom';

export function Footer({ config }) {
  const { contact, social, brandName, brandDescription } = config;

  return (
    <footer className="footer footer--flux">
      <div className="footer__inner page-width">
        <div className="footer__grid">
          <div className="reveal">
            <div className="pill">GPI · GTM</div>
            <h2 className="footer__title">{brandName}</h2>
            <p className="footer__text">
              {brandDescription ||
                'Everyday spices, salts, and home-care staples crafted for Indian kitchens and beyond.'}
            </p>
          </div>
          <div className="footer__col reveal">
            <h3 className="footer__heading">Shop</h3>
            <Link className="footer__link" to="/collections/gpi-products">
              GPI products
            </Link>
            <Link className="footer__link" to="/collections/gtm-products">
              GTM products
            </Link>
            <Link className="footer__link" to="/collections/all">
              All products
            </Link>
          </div>
          <div className="footer__col reveal">
            <h3 className="footer__heading">Support</h3>
            {contact?.email && (
              <a className="footer__link" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            )}
            {contact?.phone && <span className="footer__muted">{contact.phone}</span>}
            {contact?.location && <span className="footer__muted">{contact.location}</span>}
          </div>
          <div className="footer__col reveal">
            <h3 className="footer__heading">Newsletter</h3>
            <form
              className="footer__form"
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thanks — connect a mail provider in production.');
              }}
            >
              <div className="form-row">
                <input className="input" type="email" required placeholder="Email address" aria-label="Email" />
                <button type="submit" className="btn btn--primary">
                  Subscribe
                </button>
              </div>
            </form>
            <span className="footer__muted">No spam. Just recipes, launches, and offers.</span>
            <div className="footer__social">
              {social?.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              )}
              {social?.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer">
                  Facebook
                </a>
              )}
              {social?.youtube && (
                <a href={social.youtube} target="_blank" rel="noreferrer">
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <span className="footer__muted">
            © {new Date().getFullYear()} {brandName}. Built as a standalone storefront (Node + React + SQL).
          </span>
        </div>
      </div>
    </footer>
  );
}
