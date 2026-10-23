import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { readDb, writeDb } from '../utils/db.js';
import { authRequired } from '../middleware/auth.js';
import { STATE_CODES, stateCodeFromGstin } from '../utils/gst.js';

const router = Router();

/** GET /api/clients */
router.get('/', authRequired, (req, res) => {
  const db = readDb();
  const clients = db.clients.filter((c) => c.companyId === req.companyId);
  res.json({ clients });
});

/** POST /api/clients — create client details */
router.post('/', authRequired, (req, res) => {
  const { name, gstin, email, phone, address, city, state, stateCode, pincode } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Client name is required' });
  }

  let normalizedGstin = '';
  let derivedCode = stateCode || '';

  if (gstin) {
    normalizedGstin = String(gstin).trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(normalizedGstin)) {
      return res.status(400).json({ error: 'Invalid client GSTIN format' });
    }
    derivedCode = derivedCode || stateCodeFromGstin(normalizedGstin);
  }

  if (!derivedCode && !state) {
    return res.status(400).json({ error: 'state or GSTIN (for state code) is required' });
  }

  const client = {
    id: uuid(),
    companyId: req.companyId,
    name: name.trim(),
    gstin: normalizedGstin,
    email: email || '',
    phone: phone || '',
    address: address || '',
    city: city || '',
    state: state || STATE_CODES[derivedCode] || '',
    stateCode: derivedCode,
    pincode: pincode || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = readDb();
  db.clients.push(client);
  writeDb(db);
  res.status(201).json({ client });
});

/** PUT /api/clients/:id */
router.put('/:id', authRequired, (req, res) => {
  const db = readDb();
  const idx = db.clients.findIndex(
    (c) => c.id === req.params.id && c.companyId === req.companyId
  );
  if (idx === -1) return res.status(404).json({ error: 'Client not found' });

  const existing = db.clients[idx];
  const { name, gstin, email, phone, address, city, state, stateCode, pincode } = req.body;

  let nextGstin = existing.gstin;
  let derivedCode = stateCode || existing.stateCode;

  if (gstin !== undefined) {
    if (gstin) {
      nextGstin = String(gstin).trim().toUpperCase();
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(nextGstin)) {
        return res.status(400).json({ error: 'Invalid client GSTIN format' });
      }
      derivedCode = stateCode || stateCodeFromGstin(nextGstin);
    } else {
      nextGstin = '';
    }
  }

  db.clients[idx] = {
    ...existing,
    name: name?.trim() ?? existing.name,
    gstin: nextGstin,
    email: email ?? existing.email,
    phone: phone ?? existing.phone,
    address: address ?? existing.address,
    city: city ?? existing.city,
    state: state || STATE_CODES[derivedCode] || existing.state,
    stateCode: derivedCode,
    pincode: pincode ?? existing.pincode,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  res.json({ client: db.clients[idx] });
});

/** DELETE /api/clients/:id */
router.delete('/:id', authRequired, (req, res) => {
  const db = readDb();
  const before = db.clients.length;
  db.clients = db.clients.filter(
    (c) => !(c.id === req.params.id && c.companyId === req.companyId)
  );
  if (db.clients.length === before) {
    return res.status(404).json({ error: 'Client not found' });
  }
  writeDb(db);
  res.json({ ok: true });
});

export default router;
