import path from 'path';
import { fileURLToPath } from 'url';

import { catalogFallback } from './catalogFallback.js';
import { openDb, migrate } from './db.js';
import { loadCatalogFromCsv } from './loadCatalog.js';

const __filename = fileURLToPath(import.meta.url);

export const collections = [
  { handle: 'all', title: 'All Products', description: 'Browse every GPI and GTM product.' },
  { handle: 'gtm-products', title: 'GTM Products', description: 'Premium Himalayan salts and natural minerals.' },
  { handle: 'gpi-products', title: 'GPI Products', description: 'Authentic spices, masalas, and household essentials.' },
  { handle: 'pink-salt', title: 'Pink Salt', description: 'Himalayan pink salt collection.' },
  { handle: 'black-salt', title: 'Black Salt', description: 'Kala Namak and specialty salts.' },
  { handle: 'himalayan-salt', title: 'Himalayan Salt', description: 'Pink, rock, and mineral-rich salts.' },
];

export function getCatalogProducts() {
  const fromCsv = loadCatalogFromCsv();
  if (fromCsv.length) return fromCsv;
  return catalogFallback;
}

export function seedData(db) {
  const catalogProducts = getCatalogProducts();
  if (!catalogProducts.length) {
    console.warn('No products to seed (missing CSV and fallback empty).');
    return;
  }

  // Disable foreign keys during re-sync to avoid constraint errors 
  // if some products need deletion before their children.
  db.pragma('foreign_keys = OFF');

  const validHandles = new Set(catalogProducts.map((p) => p.handle));
  const orphanProducts = db
    .prepare('SELECT id, handle FROM products')
    .all()
    .filter((r) => !validHandles.has(r.handle));
  for (const row of orphanProducts) {
    db.prepare('DELETE FROM products WHERE id = ?').run(row.id);
  }

  const insertCol = db.prepare(
    `INSERT INTO collections (handle, title, description) VALUES (@handle, @title, @description)
     ON CONFLICT(handle) DO UPDATE SET title = excluded.title, description = excluded.description`
  );
  for (const c of collections) insertCol.run(c);

  const colId = (handle) =>
    db.prepare('SELECT id FROM collections WHERE handle = ?').get(handle).id;

  const upsertProduct = db.prepare(`
    INSERT INTO products (handle, title, description, price_cents, compare_at_cents, image_url, brand, available)
    VALUES (@handle, @title, @description, @price_cents, @compare_at_cents, @image_url, @brand, 1)
    ON CONFLICT(handle) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      price_cents = excluded.price_cents,
      compare_at_cents = excluded.compare_at_cents,
      image_url = excluded.image_url,
      brand = excluded.brand
  `);

  const link = db.prepare(
    'INSERT OR IGNORE INTO product_collections (product_id, collection_id) VALUES (?, ?)'
  );

  db.exec('DELETE FROM product_collections');

  for (const p of catalogProducts) {
    const { collections: colHandles, ...row } = p;
    upsertProduct.run({
      ...row,
      compare_at_cents: row.compare_at_cents ?? null,
    });
    const pid = db.prepare('SELECT id FROM products WHERE handle = ?').get(p.handle).id;
    for (const h of colHandles) {
      try {
        link.run(pid, colId(h));
      } catch {
        console.warn('Unknown collection:', h, 'for', p.handle);
      }
    }
  }

  db.pragma('foreign_keys = ON');
}

export function seedIfEmpty(db) {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM products').get();
  if (c > 0) return;
  seedData(db);
  console.log('Seeded', getCatalogProducts().length, 'products (first run).');
}

export function resetAndSeed() {
  const db = openDb();
  migrate(db);
  seedData(db);
  const n = getCatalogProducts().length;
  db.close();
  console.log('Database reset and seeded:', n, 'products');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  resetAndSeed();
}
