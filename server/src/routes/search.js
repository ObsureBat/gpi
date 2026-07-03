import { Router } from 'express';

export const searchRouter = Router();

searchRouter.get('/', (req, res) => {
  const db = req.app.locals.db;
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const like = `%${q.replace(/%/g, '')}%`;
  const rows = db
    .prepare(
      `SELECT id, handle, title, price_cents, image_url, brand
       FROM products
       WHERE available = 1 AND (title LIKE ? OR handle LIKE ? OR description LIKE ?)
       ORDER BY title
       LIMIT 24`
    )
    .all(like, like, like);
  res.json(rows);
});
