# GST Invoice Maker

Full-stack app to register a company, manage GST profiles, save clients, enter line-item prices, and generate CGST/SGST or IGST tax invoices.

## Stack

- **Frontend:** React + Vite (`frontend/`)
- **Backend:** Express + JWT auth + JSON file store (`backend/`)

## Features

1. **Company GST details** — name, GSTIN, PAN, address, state, contact
2. **Client details** — buyer profile with GSTIN / place of supply
3. **Price details** — description, HSN/SAC, qty, rate, GST %
4. **Login / signup** — company account with JWT sessions
5. **Invoices** — auto CGST+SGST (same state) or IGST (different state), print/PDF via browser

## Quick start

```bash
cd gst-invoice-maker
npm run install:all
```

Terminal 1 — API (port 4100):

```bash
npm run dev:api
```

Terminal 2 — web (port 5173):

```bash
npm run dev:web
```

Open http://localhost:5173

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register company + GST details |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current company |
| GET/PUT | `/api/company` | Read/update company GST profile |
| GET/POST | `/api/clients` | List / create clients |
| PUT/DELETE | `/api/clients/:id` | Update / delete client |
| GET/POST | `/api/invoices` | List / create invoices |
| GET/DELETE | `/api/invoices/:id` | View / delete invoice |

Data is stored in `backend/data/store.json`. Set `JWT_SECRET` in `backend/.env` for production.
