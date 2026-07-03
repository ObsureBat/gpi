import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const COOKIE = 'gpi_sid';

function getOrCreateSessionId(req, res) {
  let sid = req.cookies[COOKIE];
  if (!sid) {
    sid = uuidv4();
    res.cookie(COOKIE, sid, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    const db = req.app.locals.db;
    db.prepare('INSERT OR IGNORE INTO cart_sessions (id) VALUES (?)').run(sid);
  }
  return sid;
}

export const cartRouter = Router();

cartRouter.get('/', (req, res) => {
  const db = req.app.locals.db;
  const sid = getOrCreateSessionId(req, res);
  const rows = db
    .prepare(
      `SELECT ci.product_id, ci.quantity, p.handle, p.title, p.price_cents, p.image_url, p.brand
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.session_id = ?`
    )
    .all(sid);
  const subtotal = rows.reduce((s, r) => s + r.price_cents * r.quantity, 0);
  res.json({ items: rows, subtotal_cents: subtotal, item_count: rows.reduce((n, r) => n + r.quantity, 0) });
});

cartRouter.post('/add', (req, res) => {
  const db = req.app.locals.db;
  const sid = getOrCreateSessionId(req, res);
  const { product_id, quantity = 1 } = req.body;
  const pid = Number(product_id);
  const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
  if (!pid) return res.status(400).json({ error: 'product_id required' });

  const p = db.prepare('SELECT id FROM products WHERE id = ? AND available = 1').get(pid);
  if (!p) return res.status(404).json({ error: 'Product not found' });

  const existing = db
    .prepare('SELECT quantity FROM cart_items WHERE session_id = ? AND product_id = ?')
    .get(sid, pid);
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE session_id = ? AND product_id = ?').run(
      Math.min(99, existing.quantity + qty),
      sid,
      pid
    );
  } else {
    db.prepare('INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)').run(
      sid,
      pid,
      qty
    );
  }
  res.json({ ok: true });
});

cartRouter.post('/update', (req, res) => {
  const db = req.app.locals.db;
  const sid = getOrCreateSessionId(req, res);
  const { product_id, quantity } = req.body;
  const pid = Number(product_id);
  const qty = Number(quantity);
  if (!pid || qty < 0) return res.status(400).json({ error: 'Invalid payload' });
  if (qty === 0) {
    db.prepare('DELETE FROM cart_items WHERE session_id = ? AND product_id = ?').run(sid, pid);
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE session_id = ? AND product_id = ?').run(
      Math.min(99, qty),
      sid,
      pid
    );
  }
  res.json({ ok: true });
});

cartRouter.post('/clear', (req, res) => {
  const db = req.app.locals.db;
  const sid = req.cookies[COOKIE];
  if (sid) db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sid);
  res.json({ ok: true });
});
