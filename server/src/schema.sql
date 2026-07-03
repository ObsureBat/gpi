PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart_sessions;
DROP TABLE IF EXISTS product_collections;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS collections;

CREATE TABLE collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  compare_at_cents INTEGER,
  image_url TEXT,
  brand TEXT NOT NULL CHECK (brand IN ('gtm', 'gpi')),
  available INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE product_collections (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_id)
);

CREATE TABLE cart_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE cart_items (
  session_id TEXT NOT NULL REFERENCES cart_sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (session_id, product_id)
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  title_snapshot TEXT NOT NULL
);

CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_cart_items_session ON cart_items(session_id);
