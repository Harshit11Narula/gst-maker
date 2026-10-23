import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { company } = useAuth();
  const [stats, setStats] = useState({ clients: 0, products: 0, invoices: 0, total: 0 });

  useEffect(() => {
    Promise.all([api('/clients'), api('/products'), api('/invoices')])
      .then(([c, p, i]) => {
        const total = i.invoices.reduce((s, inv) => s + (inv.totals?.grandTotal || 0), 0);
        setStats({
          clients: c.clients.length,
          products: p.products.length,
          invoices: i.invoices.length,
          total: Math.round(total * 100) / 100,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="panel">
        <h1 className="panel-title">Welcome, {company?.name}</h1>
        <p>
          Capture company GST details, manage products and clients, and issue tax invoices with your logo.
        </p>
        <div className="stat-row">
          <div className="stat">
            <strong>{stats.clients}</strong>
            <span className="muted">Clients</span>
          </div>
          <div className="stat">
            <strong>{stats.products}</strong>
            <span className="muted">Products</span>
          </div>
          <div className="stat">
            <strong>{stats.invoices}</strong>
            <span className="muted">Invoices</span>
          </div>
          <div className="stat">
            <strong>₹{stats.total.toLocaleString('en-IN')}</strong>
            <span className="muted">Billed</span>
          </div>
        </div>
        <div className="btn-row">
          <Link className="btn btn-primary" to="/invoices/new" style={{ display: 'inline-block' }}>
            Create invoice
          </Link>
          <Link className="btn btn-ghost" to="/products" style={{ display: 'inline-block' }}>
            Add product
          </Link>
          <Link className="btn btn-ghost" to="/clients" style={{ display: 'inline-block' }}>
            Add client
          </Link>
          <Link className="btn btn-ghost" to="/company" style={{ display: 'inline-block' }}>
            Company & logo
          </Link>
        </div>
      </div>
    </>
  );
}
