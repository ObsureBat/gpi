import { Router } from 'express';

const COOKIE = 'gpi_sid';

export const checkoutRouter = Router();

checkoutRouter.post('/', (req, res) => {
  const db = req.app.locals.db;
  const sid = req.cookies[COOKIE];
  if (!sid) return res.status(400).json({ error: 'Cart empty' });

  const {
    email,
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country = 'India',
  } = req.body;

  if (!email || !full_name || !address_line1 || !city || !postal_code) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const items = db
    .prepare(
      `SELECT ci.product_id, ci.quantity, p.title, p.price_cents
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.session_id = ?`
    )
    .all(sid);

  if (!items.length) return res.status(400).json({ error: 'Cart empty' });

  const total = items.reduce((s, r) => s + r.price_cents * r.quantity, 0);

  const insertOrder = db.prepare(`
    INSERT INTO orders (email, full_name, phone, address_line1, address_line2, city, state, postal_code, country, total_cents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, price_cents, title_snapshot)
    VALUES (?, ?, ?, ?, ?)
  `);

  const run = db.transaction(() => {
    const info = insertOrder.run(
      email,
      full_name,
      phone || null,
      address_line1,
      address_line2 || null,
      city,
      state || null,
      postal_code,
      country,
      total
    );
    const orderId = info.lastInsertRowid;
    for (const it of items) {
      insertItem.run(orderId, it.product_id, it.quantity, it.price_cents, it.title);
    }
    db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sid);
    return orderId;
  });

  try {
    const orderId = run();
    res.json({ order_id: orderId, total_cents: total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Checkout failed' });
  }
});
