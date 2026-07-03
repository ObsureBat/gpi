const base = '';

// Read JSON data
async function loadProductsFromJSON() {
  try {
    const response = await fetch('/data/products.json');
    const products = await response.json();
    console.log('Loaded products from JSON:', products.length);
    return products;
  } catch (error) {
    console.error('Error loading JSON:', error);
    return [];
  }
}

let cachedProducts = null;

async function getProducts() {
  if (!cachedProducts) {
    cachedProducts = await loadProductsFromJSON();
  }
  return cachedProducts;
}

const MOCK_PRODUCTS = [];

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

  if (pathname === '/api/products') return getProducts();
  if (pathname.startsWith('/api/products/')) {
    const handle = decodeURIComponent(pathname.replace('/api/products/', ''));
    return getProducts().then(products => {
      const row = products.find((p) => p.handle === handle);
      if (!row) throw new Error('Product not found');
      return row;
    });
  }

  if (pathname === '/api/collections') {
    return getProducts().then(products => [
      { handle: 'all', title: 'All Products', description: 'All available products', products },
      {
        handle: 'gpi-products',
        title: 'GPI Products',
        description: 'Premium spices and detergents from GPI',
        products: products.filter((p) => p.brand === 'gpi'),
      },
      {
        handle: 'gtm-products',
        title: 'GTM Products', 
        description: 'Authentic Himalayan salts from GTM',
        products: products.filter((p) => p.brand === 'gtm'),
      },
      {
        handle: 'himalayan-salt',
        title: 'Himalayan Salt',
        description: 'Premium Himalayan salt collection',
        products: products.filter((p) => p.handle.includes('salt')),
      },
      {
        handle: 'pink-salt',
        title: 'Pink Salt',
        description: 'Pure pink salt products',
        products: products.filter((p) => p.handle.includes('pink-salt')),
      },
      {
        handle: 'black-salt',
        title: 'Black Salt',
        description: 'Authentic black and rock salt products',
        products: products.filter((p) => p.handle.includes('rock-salt')),
      },
    ]);
  }
  if (pathname.startsWith('/api/collections/')) {
    const handle = decodeURIComponent(pathname.replace('/api/collections/', ''));
    return mockResponse('/api/collections').then(collections => {
      const row = collections.find((c) => c.handle === handle);
      if (!row) throw new Error('Collection not found');
      return row;
    });
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
    return getProducts().then(products => 
      products.filter((p) => (p.title + ' ' + p.description).toLowerCase().includes(q))
    );
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
