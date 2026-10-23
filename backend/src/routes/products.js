import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { readDb, writeDb } from '../utils/db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

/** GET /api/products */
router.get('/', authRequired, (req, res) => {
  const db = readDb();
  const products = db.products
    .filter((p) => p.companyId === req.companyId)
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json({ products });
});

/** POST /api/products */
router.post('/', authRequired, (req, res) => {
  const { name, hsn, rate, gstRate, unit } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }
  if (Number(rate) < 0 || Number.isNaN(Number(rate))) {
    return res.status(400).json({ error: 'Invalid rate' });
  }

  const product = {
    id: uuid(),
    companyId: req.companyId,
    name: name.trim(),
    hsn: hsn ? String(hsn).trim() : '',
    rate: Number(rate) || 0,
    gstRate: Number(gstRate) || 18,
    unit: unit ? String(unit).trim() : 'Nos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = readDb();
  db.products.push(product);
  writeDb(db);
  res.status(201).json({ product });
});

/** PUT /api/products/:id */
router.put('/:id', authRequired, (req, res) => {
  const db = readDb();
  const idx = db.products.findIndex(
    (p) => p.id === req.params.id && p.companyId === req.companyId
  );
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const existing = db.products[idx];
  const { name, hsn, rate, gstRate, unit } = req.body;

  if (rate !== undefined && (Number(rate) < 0 || Number.isNaN(Number(rate)))) {
    return res.status(400).json({ error: 'Invalid rate' });
  }

  db.products[idx] = {
    ...existing,
    name: name?.trim() ?? existing.name,
    hsn: hsn !== undefined ? String(hsn).trim() : existing.hsn,
    rate: rate !== undefined ? Number(rate) || 0 : existing.rate,
    gstRate: gstRate !== undefined ? Number(gstRate) || 0 : existing.gstRate,
    unit: unit !== undefined ? String(unit).trim() || 'Nos' : existing.unit,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  res.json({ product: db.products[idx] });
});

/** DELETE /api/products/:id */
router.delete('/:id', authRequired, (req, res) => {
  const db = readDb();
  const before = db.products.length;
  db.products = db.products.filter(
    (p) => !(p.id === req.params.id && p.companyId === req.companyId)
  );
  if (db.products.length === before) {
    return res.status(404).json({ error: 'Product not found' });
  }
  writeDb(db);
  res.json({ ok: true });
});

export default router;
