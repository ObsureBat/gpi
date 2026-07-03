import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { openDb, ensureSchema } from './db.js';
import { seedIfEmpty, seedData, getCatalogProducts } from './seed.js';
import { productsRouter } from './routes/products.js';
import { collectionsRouter } from './routes/collections.js';
import { cartRouter } from './routes/cart.js';
import { checkoutRouter } from './routes/checkout.js';
import { searchRouter } from './routes/search.js';
import { configRouter } from './routes/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 4000;

let db;
try {
  db = openDb();
  ensureSchema(db);
  seedIfEmpty(db);

  function catalogMatchesDb() {
    const catalog = getCatalogProducts();
    if (!catalog.length) return true;
    const rows = db.prepare('SELECT handle FROM products').all();
    if (rows.length !== catalog.length) return false;
    const dbHandles = new Set(rows.map((r) => r.handle));
    return catalog.every((p) => dbHandles.has(p.handle));
  }

  if (!catalogMatchesDb()) {
    console.log('[catalog] Syncing SQLite from Shopify CSV export…');
    seedData(db);
  }

  const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  console.log(`[catalog] ${productCount} products in store`);
} catch (err) {
  console.error('[server] Initialization failed:', err);
  // On Vercel, we might still want the server to start even if DB fails,
  // though most routes will then fail. But it's better than a cold crash.
}

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

if (db) app.locals.db = db;

// Middleware to ensure DB is available for /api routes
app.use('/api', (req, res, next) => {
  if (!req.app.locals.db) {
    return res.status(503).json({ error: 'Database not initialized', message: 'The server is currently unable to connect to the database.' });
  }
  next();
});

// Add a catch-all error handler for Express
app.use((err, req, res, next) => {
  console.error('[express] Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, environment: process.env.VERCEL ? 'vercel' : 'local' });
});

// Routes
app.use('/api', configRouter);
app.use('/api/products', productsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/search', searchRouter);

// Local static serving (only for non-Vercel runs)
if (!process.env.VERCEL) {
  const clientDist = path.join(__dirname, '..', '..', 'dist');
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`API http://localhost:${PORT}`);
  });
}

export default app;
