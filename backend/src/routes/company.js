import { Router } from 'express';
import { readDb, writeDb } from '../utils/db.js';
import { authRequired } from '../middleware/auth.js';
import { STATE_CODES, stateCodeFromGstin } from '../utils/gst.js';

const router = Router();

function publicCompany(company) {
  const { passwordHash, ...rest } = company;
  return rest;
}

/** GET /api/company — current company GST profile */
router.get('/', authRequired, (req, res) => {
  const db = readDb();
  const company = db.companies.find((c) => c.id === req.companyId);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json({ company: publicCompany(company) });
});

/** PUT /api/company — update company GST details */
router.put('/', authRequired, (req, res) => {
  const {
    name,
    gstin,
    pan,
    address,
    city,
    state,
    stateCode,
    pincode,
    phone,
  } = req.body;

  const db = readDb();
  const idx = db.companies.findIndex((c) => c.id === req.companyId);
  if (idx === -1) return res.status(404).json({ error: 'Company not found' });

  const existing = db.companies[idx];
  let nextGstin = existing.gstin;
  if (gstin) {
    nextGstin = String(gstin).trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(nextGstin)) {
      return res.status(400).json({ error: 'Invalid GSTIN format' });
    }
    const clash = db.companies.some((c) => c.id !== existing.id && c.gstin === nextGstin);
    if (clash) return res.status(409).json({ error: 'GSTIN already registered' });
  }

  const derivedCode = stateCode || stateCodeFromGstin(nextGstin) || existing.stateCode;

  db.companies[idx] = {
    ...existing,
    name: name?.trim() ?? existing.name,
    gstin: nextGstin,
    pan: (pan || nextGstin.slice(2, 12)).toUpperCase(),
    address: address ?? existing.address,
    city: city ?? existing.city,
    state: state || STATE_CODES[derivedCode] || existing.state,
    stateCode: derivedCode,
    pincode: pincode ?? existing.pincode,
    phone: phone ?? existing.phone,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  res.json({ company: publicCompany(db.companies[idx]) });
});

const MAX_LOGO_CHARS = 900_000; // ~675KB base64

/** PUT /api/company/logo — upload company logo (data URL) */
router.put('/logo', authRequired, (req, res) => {
  const { logo } = req.body;
  const db = readDb();
  const idx = db.companies.findIndex((c) => c.id === req.companyId);
  if (idx === -1) return res.status(404).json({ error: 'Company not found' });

  if (logo === null || logo === '') {
    db.companies[idx] = {
      ...db.companies[idx],
      logo: '',
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);
    return res.json({ company: publicCompany(db.companies[idx]) });
  }

  if (typeof logo !== 'string' || !logo.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Logo must be an image data URL' });
  }
  if (logo.length > MAX_LOGO_CHARS) {
    return res.status(400).json({ error: 'Logo is too large (max ~500KB)' });
  }

  db.companies[idx] = {
    ...db.companies[idx],
    logo,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  res.json({ company: publicCompany(db.companies[idx]) });
});

export default router;
