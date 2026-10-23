import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const MAX_LOGO_BYTES = 500 * 1024;

export default function CompanyPage() {
  const { company, updateCompany } = useAuth();
  const [form, setForm] = useState(null);
  const [states, setStates] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        gstin: company.gstin || '',
        pan: company.pan || '',
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        stateCode: company.stateCode || '',
        pincode: company.pincode || '',
      });
    }
  }, [company]);

  useEffect(() => {
    api('/meta/states')
      .then((d) => setStates(d.states))
      .catch(() => {});
  }, []);

  if (!form) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/company', { method: 'PUT', body: form });
      updateCompany(data.company);
      setMessage('Company GST details saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setError('');
    setMessage('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, or WebP).');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('Logo must be under 500KB.');
      return;
    }

    setLogoBusy(true);
    try {
      const logo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read logo file'));
        reader.readAsDataURL(file);
      });
      const data = await api('/company/logo', { method: 'PUT', body: { logo } });
      updateCompany(data.company);
      setMessage('Company logo saved. It will appear on new invoices.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLogoBusy(false);
    }
  };

  const removeLogo = async () => {
    setLogoBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/company/logo', { method: 'PUT', body: { logo: '' } });
      updateCompany(data.company);
      setMessage('Company logo removed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLogoBusy(false);
    }
  };

  return (
    <div className="panel">
      <h1 className="panel-title">Company GST details</h1>
      <p>These details appear as the seller on every tax invoice.</p>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-ok">{message}</div>}

      <div className="logo-upload">
        <div className="logo-preview">
          {company?.logo ? (
            <img src={company.logo} alt={`${company.name} logo`} />
          ) : (
            <span className="muted">No logo</span>
          )}
        </div>
        <div>
          <h2 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>
            Company logo
          </h2>
          <p className="muted" style={{ marginBottom: '0.75rem' }}>
            Shown on tax invoices and PDF downloads. PNG/JPG/WebP, max 500KB.
          </p>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <label className="btn btn-ghost" style={{ cursor: logoBusy ? 'wait' : 'pointer' }}>
              {logoBusy ? 'Uploading…' : 'Upload logo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                disabled={logoBusy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  uploadLogo(file);
                }}
              />
            </label>
            {company?.logo && (
              <button type="button" className="btn btn-danger" onClick={removeLogo} disabled={logoBusy}>
                Remove logo
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid-2">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Company name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>GSTIN</label>
            <input
              required
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="field">
            <label>PAN</label>
            <input
              value={form.pan}
              onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
            />
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
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="field">
            <label>State</label>
            <select
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
          <div className="field">
            <label>Pincode</label>
            <input
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Login email</label>
            <input value={company?.email || ''} disabled />
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save company details'}
          </button>
        </div>
      </form>
    </div>
  );
}
