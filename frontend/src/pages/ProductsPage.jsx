import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const empty = {
  name: '',
  hsn: '',
  rate: '',
  gstRate: 18,
  unit: 'Nos',
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api('/products')
      .then((d) => setProducts(d.products))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const hsn = String(p.hsn || '').toLowerCase();
      return name.includes(q) || hsn.includes(q);
    });
  }, [products, search]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/products', {
        method: 'POST',
        body: {
          ...form,
          rate: Number(form.rate) || 0,
          gstRate: Number(form.gstRate) || 0,
        },
      });
      setForm(empty);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api(`/products/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="panel">
        <h1 className="panel-title">Products</h1>
        <p>Save products or services so you can pick them while creating invoices.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="grid-2">
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Product / service name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>HSN / SAC</label>
              <input
                value={form.hsn}
                onChange={(e) => setForm({ ...form, hsn: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Unit</label>
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="Nos, Hrs, Kg…"
              />
            </div>
            <div className="field">
              <label>Rate (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
              />
            </div>
            <div className="field">
              <label>GST %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={form.gstRate}
                onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                placeholder="e.g. 18"
              />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Add product'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <h2 className="panel-title" style={{ marginBottom: 0 }}>
            Saved products
          </h2>
          {products.length > 0 && (
            <div className="field filter-field" style={{ marginBottom: 0, minWidth: '220px', flex: '1 1 220px' }}>
              <label htmlFor="product-search">Search products</label>
              <input
                id="product-search"
                type="search"
                placeholder="Search by name or HSN…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>
        {products.length === 0 ? (
          <p className="empty">No products yet.</p>
        ) : filtered.length === 0 ? (
          <p className="empty">No products match “{search.trim()}”.</p>
        ) : (
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>HSN</th>
                  <th>Unit</th>
                  <th>Rate</th>
                  <th>GST</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>{p.hsn || '—'}</td>
                    <td>{p.unit || 'Nos'}</td>
                    <td>₹{Number(p.rate).toLocaleString('en-IN')}</td>
                    <td>{p.gstRate}%</td>
                    <td>
                      <button type="button" className="btn btn-danger" onClick={() => remove(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
