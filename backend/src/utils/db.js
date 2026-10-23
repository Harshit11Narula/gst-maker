import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/store.json');

const defaultStore = {
  companies: [],
  clients: [],
  products: [],
  invoices: [],
};

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultStore, null, 2));
  }
}

export function readDb() {
  ensureDb();
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  if (!Array.isArray(data.products)) data.products = [];
  return data;
}

export function writeDb(data) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
