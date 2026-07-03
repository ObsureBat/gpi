import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { AnnouncementBar } from './AnnouncementBar.jsx';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';

export function Layout() {
  const [config, setConfig] = useState(null);
  const location = useLocation();

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() =>
      setConfig({
        brandName: 'GPI Industries',
        brandDescription: '',
        announcement: { mainText: '', subText: '' },
        contact: {},
        social: {},
      })
    );
  }, []);

  useEffect(() => {
    if (!config) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('reveal-visible');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    const revealSelector = '.reveal:not(.reveal-visible)';

    const observeReveals = (root) => {
      if (!root) return;
      const els = root.querySelectorAll ? root.querySelectorAll(revealSelector) : [];
      els.forEach((el) => io.observe(el));
    };

    // Observe what exists immediately.
    observeReveals(document);

    // Also observe anything added later (e.g., async product/recommendation rendering).
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (!(n instanceof Element)) continue;
          // If the node itself matches, observe it; otherwise observe its descendants.
          if (n.matches && n.matches(revealSelector)) io.observe(n);
          observeReveals(n);
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [location.pathname, config]);

  if (!config) {
    return (
      <div className="page-loading">
        <span className="spinner" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="sticky-header-wrapper">
        <AnnouncementBar config={config} />
        <Header config={config} />
      </div>
      <main id="main" className="main" role="main">
        <div key={location.pathname} className="route-transition">
          <Outlet context={config} />
        </div>
      </main>
      <Footer config={config} />
    </div>
  );
}

export function useStoreConfig() {
  return useOutletContext();
}
