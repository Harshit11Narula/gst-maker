import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { readDb, writeDb } from '../utils/db.js';
import { signToken, authRequired } from '../middleware/auth.js';
import { STATE_CODES, stateCodeFromGstin } from '../utils/gst.js';

const router = Router();

function publicCompany(company) {
  const { passwordHash, ...rest } = company;
  return rest;
}

/** POST /api/auth/signup — register company with GST details */
router.post('/signup', async (req, res) => {
  try {
    const {
      email,
      password,
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

    if (!email || !password || !name || !gstin) {
      return res.status(400).json({
        error: 'email, password, name, and gstin are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedGstin = String(gstin).trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(normalizedGstin)) {
      return res.status(400).json({ error: 'Invalid GSTIN format' });
    }

    const db = readDb();
    if (db.companies.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (db.companies.some((c) => c.gstin === normalizedGstin)) {
      return res.status(409).json({ error: 'GSTIN already registered' });
    }

    const derivedCode = stateCode || stateCodeFromGstin(normalizedGstin);
    const company = {
      id: uuid(),
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      name: name.trim(),
      gstin: normalizedGstin,
      pan: (pan || normalizedGstin.slice(2, 12)).toUpperCase(),
      address: address || '',
      city: city || '',
      state: state || STATE_CODES[derivedCode] || '',
      stateCode: derivedCode,
      pincode: pincode || '',
      phone: phone || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.companies.push(company);
    writeDb(db);

    const token = signToken(company);
    res.status(201).json({ token, company: publicCompany(company) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const db = readDb();
    const company = db.companies.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!company) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, company.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(company);
    res.json({ token, company: publicCompany(company) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/** GET /api/auth/me */
router.get('/me', authRequired, (req, res) => {
  const db = readDb();
  const company = db.companies.find((c) => c.id === req.companyId);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json({ company: publicCompany(company) });
});

export default router;
