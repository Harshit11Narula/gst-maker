import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { getFormat } from '../invoiceFormats';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api('/invoices')
      .then((d) => setInvoices(d.invoices))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) =>
      String(inv.invoiceNumber || '')
        .toLowerCase()
        .includes(q)
    );
  }, [invoices, search]);

  const remove = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await api(`/invoices/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="panel-title">Invoices</h1>
          <p>All tax invoices generated for your company.</p>
        </div>
        <Link className="btn btn-primary" to="/invoices/new" style={{ alignSelf: 'center' }}>
          New invoice
        </Link>
      </div>

      {invoices.length > 0 && (
        <div className="field filter-field">
          <label htmlFor="invoice-search">Search by invoice number</label>
          <input
            id="invoice-search"
            type="search"
            placeholder="e.g. INV-2026-0001"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {invoices.length === 0 ? (
        <p className="empty">No invoices yet.</p>
      ) : filtered.length === 0 ? (
        <p className="empty">No invoices match “{search.trim()}”.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Number</th>
                <th>Date</th>
                <th>Client</th>
                <th>Tax</th>
                <th>Format</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link to={`/invoices/${inv.id}`}>{inv.invoiceNumber}</Link>
                  </td>
                  <td>{inv.invoiceDate}</td>
                  <td>{inv.buyer?.name}</td>
                  <td>{inv.taxType === 'CGST_SGST' ? 'CGST/SGST' : 'IGST'}</td>
                  <td>{getFormat(inv.formatId).name}</td>
                  <td>₹{(inv.totals?.grandTotal || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <div className="btn-row" style={{ marginTop: 0, justifyContent: 'flex-end' }}>
                      <Link className="btn btn-ghost" to={`/invoices/${inv.id}`}>
                        View / Download
                      </Link>
                      <button type="button" className="btn btn-danger" onClick={() => remove(inv.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
