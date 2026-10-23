import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { readDb, writeDb } from '../utils/db.js';
import { authRequired } from '../middleware/auth.js';
import { calculateLineTaxes, summarizeInvoice } from '../utils/gst.js';

const router = Router();

const INVOICE_FORMAT_IDS = [
  'classic',
  'teal-banner',
  'formal',
  'slate',
  'boxed',
  'emerald',
  'compact',
  'navy-ribbon',
  'split',
  'stamp',
];

function nextInvoiceNumber(db, companyId) {
  const count = db.invoices.filter((i) => i.companyId === companyId).length + 1;
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}

/** GET /api/invoices */
router.get('/', authRequired, (req, res) => {
  const db = readDb();
  const invoices = db.invoices
    .filter((i) => i.companyId === req.companyId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ invoices });
});

/** GET /api/invoices/:id */
router.get('/:id', authRequired, (req, res) => {
  const db = readDb();
  const invoice = db.invoices.find(
    (i) => i.id === req.params.id && i.companyId === req.companyId
  );
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ invoice });
});

/**
 * POST /api/invoices
 * Body: { clientId, invoiceDate?, dueDate?, notes?, formatId?, items: [{ description, hsn, quantity, rate, gstRate }] }
 */
router.post('/', authRequired, (req, res) => {
  const { clientId, invoiceDate, dueDate, notes, formatId, items } = req.body;

  if (!clientId) return res.status(400).json({ error: 'clientId is required' });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one price/line item is required' });
  }

  for (const item of items) {
    if (!item.description?.trim()) {
      return res.status(400).json({ error: 'Each item needs a description' });
    }
    if (Number(item.quantity) <= 0 || Number(item.rate) < 0) {
      return res.status(400).json({ error: 'Invalid quantity or rate' });
    }
  }

  const db = readDb();
  const company = db.companies.find((c) => c.id === req.companyId);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const client = db.clients.find(
    (c) => c.id === clientId && c.companyId === req.companyId
  );
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const lines = calculateLineTaxes(items, company.stateCode, client.stateCode);
  const totals = summarizeInvoice(lines);
  const taxType =
    company.stateCode && client.stateCode && company.stateCode === client.stateCode
      ? 'CGST_SGST'
      : 'IGST';

  const resolvedFormat =
    formatId && INVOICE_FORMAT_IDS.includes(formatId) ? formatId : 'classic';

  const invoice = {
    id: uuid(),
    companyId: req.companyId,
    invoiceNumber: nextInvoiceNumber(db, req.companyId),
    invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
    dueDate: dueDate || '',
    notes: notes || '',
    formatId: resolvedFormat,
    taxType,
    seller: {
      name: company.name,
      gstin: company.gstin,
      pan: company.pan,
      address: company.address,
      city: company.city,
      state: company.state,
      stateCode: company.stateCode,
      pincode: company.pincode,
      phone: company.phone,
      email: company.email,
      logo: company.logo || '',
    },
    buyer: {
      id: client.id,
      name: client.name,
      gstin: client.gstin,
      address: client.address,
      city: client.city,
      state: client.state,
      stateCode: client.stateCode,
      pincode: client.pincode,
      phone: client.phone,
      email: client.email,
    },
    items: lines,
    totals,
    createdAt: new Date().toISOString(),
  };

  db.invoices.push(invoice);
  writeDb(db);
  res.status(201).json({ invoice });
});

/** PATCH /api/invoices/:id/format — change GST invoice layout */
router.patch('/:id/format', authRequired, (req, res) => {
  const { formatId } = req.body;
  if (!formatId || !INVOICE_FORMAT_IDS.includes(formatId)) {
    return res.status(400).json({ error: 'Invalid invoice format' });
  }

  const db = readDb();
  const idx = db.invoices.findIndex(
    (i) => i.id === req.params.id && i.companyId === req.companyId
  );
  if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });

  db.invoices[idx] = {
    ...db.invoices[idx],
    formatId,
  };
  writeDb(db);
  res.json({ invoice: db.invoices[idx] });
});

/** DELETE /api/invoices/:id */
router.delete('/:id', authRequired, (req, res) => {
  const db = readDb();
  const before = db.invoices.length;
  db.invoices = db.invoices.filter(
    (i) => !(i.id === req.params.id && i.companyId === req.companyId)
  );
  if (db.invoices.length === before) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  writeDb(db);
  res.json({ ok: true });
});

export default router;
