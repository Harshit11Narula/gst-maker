import { useEffect, useState } from 'react';
import { api } from '../api';

const empty = {
  name: '',
  gstin: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  stateCode: '',
  pincode: '',
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [states, setStates] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api('/clients')
      .then((d) => setClients(d.clients))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
    api('/meta/states')
      .then((d) => setStates(d.states))
      .catch(() => {});
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/clients', { method: 'POST', body: form });
      setForm(empty);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this client?')) return;
    try {
      await api(`/clients/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="panel">
        <h1 className="panel-title">Client details</h1>
        <p>Store buyer GST profiles used when creating invoices.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="grid-2">
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Client / business name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>GSTIN (optional for B2C)</label>
              <input
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field">
              <label>State</label>
              <select
                required={!form.gstin}
                value={form.stateCode}
                onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="field">
              <label>City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Pincode</label>
              <input
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Add client'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2 className="panel-title">Saved clients</h2>
        {clients.length === 0 ? (
          <p className="empty">No clients yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>GSTIN</th>
                  <th>State</th>
                  <th>Contact</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      <div className="muted">{c.city}</div>
                    </td>
                    <td>{c.gstin || '—'}</td>
                    <td>
                      {c.state} {c.stateCode ? `(${c.stateCode})` : ''}
                    </td>
                    <td>
                      {c.email}
                      <div className="muted">{c.phone}</div>
                    </td>
                    <td>
                      <button type="button" className="btn btn-danger" onClick={() => remove(c.id)}>
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
