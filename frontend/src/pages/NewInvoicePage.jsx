import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { DEFAULT_FORMAT_ID } from '../invoiceFormats';

const blankItem = () => ({
  productId: '',
  productSearch: '',
  description: '',
  hsn: '',
  quantity: 1,
  rate: 0,
  gstRate: 18,
});

export default function NewInvoicePage() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientId, setClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([blankItem()]);
  const [suggestIndex, setSuggestIndex] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const suggestRef = useRef(null);

  useEffect(() => {
    api('/clients')
      .then((d) => setClients(d.clients))
      .catch((err) => setError(err.message));
    api('/products')
      .then((d) => setProducts(d.products))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setSuggestIndex(null);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const selectedClient = clients.find((c) => c.id === clientId);

  const preview = useMemo(() => {
    const sellerCode = company?.stateCode;
    const buyerCode = selectedClient?.stateCode;
    const intra = sellerCode && buyerCode && sellerCode === buyerCode;
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    for (const item of items) {
      const t = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      const tax = t * ((Number(item.gstRate) || 0) / 100);
      taxable += t;
      if (intra) {
        cgst += tax / 2;
        sgst += tax / 2;
      } else {
        igst += tax;
      }
    }
    const round = (n) => Math.round(n * 100) / 100;
    return {
      taxType: intra ? 'CGST + SGST' : 'IGST',
      taxable: round(taxable),
      cgst: round(cgst),
      sgst: round(sgst),
      igst: round(igst),
      total: round(taxable + cgst + sgst + igst),
    };
  }, [items, company, selectedClient]);

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const matchesFor = (query) => {
    const q = String(query || '')
      .trim()
      .toLowerCase();
    if (!q) return products.slice(0, 8);
    return products
      .filter((p) => String(p.name || '').toLowerCase().includes(q))
      .slice(0, 8);
  };

  const applyProduct = (index, product) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          productId: product.id,
          productSearch: product.name,
          description: product.name,
          hsn: product.hsn || '',
          rate: product.rate,
          gstRate: product.gstRate,
        };
      })
    );
    setSuggestIndex(null);
  };

  const onProductSearchChange = (index, value) => {
    setItems((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              productSearch: value,
              productId: '',
            }
          : row
      )
    );
    setSuggestIndex(index);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payloadItems = items.map(({ description, hsn, quantity, rate, gstRate }) => ({
        description,
        hsn,
        quantity,
        rate,
        gstRate: Number(gstRate),
      }));
      const data = await api('/invoices', {
        method: 'POST',
        body: {
          clientId,
          invoiceDate,
          dueDate,
          notes,
          formatId: DEFAULT_FORMAT_ID,
          items: payloadItems,
        },
      });
      navigate(`/invoices/${data.invoice.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <h1 className="panel-title">New GST invoice</h1>
      <p>Select a client and add products or line items.</p>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="grid-3">
          <div className="field">
            <label>Client</label>
            <select required value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.gstin ? ` · ${c.gstin}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Invoice date</label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {selectedClient && (
          <p className="muted" style={{ marginTop: '0.85rem' }}>
            Place of supply: {selectedClient.state || selectedClient.stateCode} · Tax type preview:{' '}
            <strong style={{ color: 'var(--ink)' }}>{preview.taxType}</strong>
          </p>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '1rem',
            flexWrap: 'wrap',
            marginTop: '1.4rem',
          }}
        >
          <h2 className="panel-title" style={{ fontSize: '1.05rem', margin: 0 }}>
            Price details
          </h2>
          <Link to="/products" className="muted" style={{ fontSize: '0.9rem' }}>
            Manage products →
          </Link>
        </div>
        <div className="table-wrap line-items" ref={suggestRef}>
          <table className="data">
            <thead>
              <tr>
                <th>Search product</th>
                <th>Description</th>
                <th>HSN/SAC</th>
                <th>Qty</th>
                <th>Rate (₹)</th>
                <th>GST %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const suggestions = matchesFor(item.productSearch);
                const showSuggest = suggestIndex === index && products.length > 0;
                return (
                  <tr key={index}>
                    <td className="product-search-cell">
                      <div className="product-typeahead">
                        <input
                          type="search"
                          placeholder="Type product name…"
                          value={item.productSearch}
                          onChange={(e) => onProductSearchChange(index, e.target.value)}
                          onFocus={() => setSuggestIndex(index)}
                          autoComplete="off"
                        />
                        {showSuggest && (
                          <ul className="product-suggest">
                            {suggestions.length === 0 ? (
                              <li className="product-suggest-empty">No matching products</li>
                            ) : (
                              suggestions.map((p) => (
                                <li key={p.id}>
                                  <button type="button" onClick={() => applyProduct(index, p)}>
                                    <strong>{p.name}</strong>
                                    <span>
                                      {p.hsn ? `${p.hsn} · ` : ''}₹{Number(p.rate).toLocaleString('en-IN')} ·{' '}
                                      {p.gstRate}%
                                    </span>
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    </td>
                    <td>
                      <input
                        required
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        value={item.hsn}
                        onChange={(e) => updateItem(index, 'hsn', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        required
                        value={item.gstRate}
                        onChange={(e) => updateItem(index, 'gstRate', e.target.value)}
                        placeholder="18"
                      />
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!products.length && (
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            No saved products yet.{' '}
            <Link to="/products">Add products</Link> to search them here, or enter lines manually.
          </p>
        )}

        <div className="btn-row">
          <button type="button" className="btn btn-ghost" onClick={() => setItems((p) => [...p, blankItem()])}>
            Add line
          </button>
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="stat-row" style={{ marginTop: '1.2rem' }}>
          <div className="stat">
            <strong>₹{preview.taxable.toLocaleString('en-IN')}</strong>
            <span className="muted">Taxable</span>
          </div>
          {preview.taxType === 'CGST + SGST' ? (
            <>
              <div className="stat">
                <strong>₹{preview.cgst.toLocaleString('en-IN')}</strong>
                <span className="muted">CGST</span>
              </div>
              <div className="stat">
                <strong>₹{preview.sgst.toLocaleString('en-IN')}</strong>
                <span className="muted">SGST</span>
              </div>
            </>
          ) : (
            <div className="stat">
              <strong>₹{preview.igst.toLocaleString('en-IN')}</strong>
              <span className="muted">IGST</span>
            </div>
          )}
          <div className="stat">
            <strong>₹{preview.total.toLocaleString('en-IN')}</strong>
            <span className="muted">Grand total</span>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={busy || !clients.length}>
            {busy ? 'Creating…' : 'Generate invoice'}
          </button>
        </div>
        {!clients.length && (
          <p className="muted">Add a client first before creating an invoice.</p>
        )}
      </form>
    </div>
  );
}
