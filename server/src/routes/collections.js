import { Router } from 'express';

export const collectionsRouter = Router();

collectionsRouter.get('/', (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare('SELECT id, handle, title, description FROM collections ORDER BY title').all();
  res.json(rows);
});

collectionsRouter.get('/:handle', (req, res) => {
  const db = req.app.locals.db;
  const col = db.prepare('SELECT * FROM collections WHERE handle = ?').get(req.params.handle);
  if (!col) return res.status(404).json({ error: 'Collection not found' });
  const products = db
    .prepare(
      `SELECT p.id, p.handle, p.title, p.description, p.price_cents, p.compare_at_cents, p.image_url, p.brand, p.available
       FROM products p
       INNER JOIN product_collections pc ON pc.product_id = p.id
       WHERE pc.collection_id = ? AND p.available = 1
       ORDER BY p.title`
    )
    .all(col.id);
  res.json({ ...col, products });
});
