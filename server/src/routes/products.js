import { Router } from 'express';

export const productsRouter = Router();

productsRouter.get('/', (req, res) => {
  const db = req.app.locals.db;
  const brand = req.query.brand;
  let sql = `SELECT id, handle, title, description, price_cents, compare_at_cents, image_url, brand, available
             FROM products WHERE available = 1`;
  const params = [];
  if (brand === 'gtm' || brand === 'gpi') {
    sql += ' AND brand = ?';
    params.push(brand);
  }
  sql += ' ORDER BY title';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

productsRouter.get('/:handle', (req, res) => {
  const db = req.app.locals.db;
  const row = db
    .prepare(
      `SELECT p.*, GROUP_CONCAT(c.handle) AS collection_handles
       FROM products p
       LEFT JOIN product_collections pc ON pc.product_id = p.id
       LEFT JOIN collections c ON c.id = pc.collection_id
       WHERE p.handle = ?
       GROUP BY p.id`
    )
    .get(req.params.handle);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});
