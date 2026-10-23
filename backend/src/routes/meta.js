import { Router } from 'express';
import { STATE_CODES } from '../utils/gst.js';

const router = Router();

router.get('/states', (_req, res) => {
  const states = Object.entries(STATE_CODES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json({ states });
});

router.get('/gst-rates', (_req, res) => {
  res.json({ rates: [0, 5, 12, 18, 28] });
});

export default router;
