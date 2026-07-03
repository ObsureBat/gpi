const base = '';

const MOCK_PRODUCTS = [
  {
    id: 1,
    handle: 'gtm-himalayan-pink-salt-200g',
    title: 'GTM Himalayan Pink Salt 200g',
    brand: 'gtm',
    description: 'Natural Himalayan pink salt for everyday cooking.',
    price_cents: 9900,
    compare_at_cents: 11900,
    image_url: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=900&q=80',
  },
  {
    id: 2,
    handle: 'gtm-himalayan-rock-salt-200g',
    title: 'GTM Himalayan Rock Salt 200g',
    brand: 'gtm',
    description: 'Pure rock salt with authentic taste and natural minerals.',
    price_cents: 8900,
    compare_at_cents: 10900,
    image_url: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=900&q=80',
  },
  {
    id: 3,
    handle: 'gpi-garam-masala-100g',
    title: 'GPI Garam Masala 100g',
    brand: 'gpi',
    description: 'Aromatic spice blend for rich Indian flavor.',
    price_cents: 12900,
    compare_at_cents: 14900,
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&q=80',
  },
  {
    id: 4,
    handle: 'gpi-chaat-masala-100g',
    title: 'GPI Chaat Masala 100g',
    brand: 'gpi',
    description: 'Tangy masala for chaats, fruits, and snacks.',
    price_cents: 11900,
    compare_at_cents: 13900,
    image_url: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=900&q=80',
  },
];

function getLocalCartItems() {
  try {
    return JSON.parse(localStorage.getItem('gpi_mock_cart_items') || '[]');
  } catch {
    return [];
  }
}

function setLocalCartItems(items) {
  try {
    localStorage.setItem('gpi_mock_cart_items', JSON.stringify(items));
  } catch {
    // Ignore storage limits/private mode.
  }
}

function toCart(items) {
  const enriched = items
    .map((i) => {
      const p = MOCK_PRODUCTS.find((x) => x.id === i.product_id);
      if (!p) return null;
      return { ...i, product: p, line_total_cents: p.price_cents * i.quantity };
    })
    .filter(Boolean);

  const subtotal = enriched.reduce((sum, i) => sum + i.line_total_cents, 0);
  const count = enriched.reduce((sum, i) => sum + i.quantity, 0);
  return { items: enriched, subtotal_cents: subtotal, item_count: count };
}

function mockResponse(path, options = {}) {
  const url = new URL(path, 'https://local.mock');
  const pathname = url.pathname;
  const method = (options.method || 'GET').toUpperCase();

  if (pathname === '/api/store-config') return { store_name: 'GPI / GTM', currency: 'INR' };

  if (pathname === '/api/products') return MOCK_PRODUCTS;
  if (pathname.startsWith('/api/products/')) {
    const handle = decodeURIComponent(pathname.replace('/api/products/', ''));
    const row = MOCK_PRODUCTS.find((p) => p.handle === handle);
    if (!row) throw new Error('Product not found');
    return row;
  }

  if (pathname === '/api/collections') {
    return [
      { handle: 'all', title: 'All Products', description: 'All available products', products: MOCK_PRODUCTS },
      {
        handle: 'himalayan-salt',
        title: 'Himalayan Salt',
        description: 'Premium Himalayan salt collection',
        products: MOCK_PRODUCTS.filter((p) => p.handle.includes('salt')),
      },
      {
        handle: 'pink-salt',
        title: 'Pink Salt',
        description: 'Pure pink salt products',
        products: MOCK_PRODUCTS.filter((p) => p.handle.includes('pink-salt')),
      },
      {
        handle: 'black-salt',
        title: 'Black Salt',
        description: 'Authentic black and rock salt products',
        products: MOCK_PRODUCTS.filter((p) => p.handle.includes('rock-salt')),
      },
    ];
  }
  if (pathname.startsWith('/api/collections/')) {
    const handle = decodeURIComponent(pathname.replace('/api/collections/', ''));
    const all = mockResponse('/api/collections');
    const row = all.find((c) => c.handle === handle);
    if (!row) throw new Error('Collection not found');
    return row;
  }

  if (pathname === '/api/cart' && method === 'GET') {
    return toCart(getLocalCartItems());
  }
  if (pathname === '/api/cart/add' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const items = getLocalCartItems();
    const existing = items.find((i) => i.product_id === Number(body.product_id));
    if (existing) existing.quantity += Math.max(1, Number(body.quantity || 1));
    else items.push({ product_id: Number(body.product_id), quantity: Math.max(1, Number(body.quantity || 1)) });
    setLocalCartItems(items);
    return toCart(items);
  }
  if (pathname === '/api/cart/update' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const productId = Number(body.product_id);
    const quantity = Math.max(0, Number(body.quantity || 0));
    let items = getLocalCartItems();
    items = quantity > 0 ? items.map((i) => (i.product_id === productId ? { ...i, quantity } : i)) : items.filter((i) => i.product_id !== productId);
    setLocalCartItems(items);
    return toCart(items);
  }

  if (pathname === '/api/search') {
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    if (!q) return [];
    return MOCK_PRODUCTS.filter((p) => (p.title + ' ' + p.description).toLowerCase().includes(q));
  }

  if (pathname === '/api/checkout' && method === 'POST') {
    return { ok: true, order_id: 'MOCK-' + Date.now() };
  }

  throw new Error('Mock API route not found: ' + pathname);
}

async function json(path, options = {}) {
  try {
    const res = await fetch(`${base}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || res.statusText);
    }
    return await res.json();
  } catch {
    return mockResponse(path, options);
  }
}

export const api = {
  getConfig: () => json('/api/store-config'),
  getProducts: (params = '') => json(`/api/products${params}`),
  getProduct: (handle) => json('/api/products/' + encodeURIComponent(handle)),
  getCollections: () => json('/api/collections'),
  getCollection: (handle) => json('/api/collections/' + encodeURIComponent(handle)),
  getCart: () => json('/api/cart'),
  addToCart: (product_id, quantity = 1) =>
    json('/api/cart/add', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
  updateCart: (product_id, quantity) =>
    json('/api/cart/update', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
  search: (q) => json('/api/search?q=' + encodeURIComponent(q)),
  checkout: (payload) =>
    json('/api/checkout', { method: 'POST', body: JSON.stringify(payload) }),
};
