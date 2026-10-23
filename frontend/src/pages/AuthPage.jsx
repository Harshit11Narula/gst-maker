import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';

const emptySignup = {
  name: '',
  email: '',
  password: '',
  gstin: '',
  pan: '',
  phone: '',
  address: '',
  city: '',
  stateCode: '',
  pincode: '',
};

export default function AuthPage() {
  const { company, loading, login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [states, setStates] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/meta/states')
      .then((d) => setStates(d.states))
      .catch(() => {});
  }, []);

  if (!loading && company) return <Navigate to="/" replace />;

  const onLogin = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(loginForm.email, loginForm.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onSignup = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(signupForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hero-auth">
      <div className="hero-auth-inner">
        <div className="hero-copy">
          <div className="brand-mark">
            GST <span>Invoice Maker</span>
          </div>
          <p>
            Register your company, save client GST profiles, add line prices, and generate
            CGST/SGST or IGST invoices in minutes.
          </p>
        </div>

        <div className="panel auth-card">
          <div className="tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              Sign up
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {mode === 'login' ? (
            <form onSubmit={onLogin}>
              <div className="grid-2">
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="login-email">Company email</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    minLength={6}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? 'Signing in…' : 'Login'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onSignup}>
              <p className="muted" style={{ marginTop: 0 }}>
                Create your company account with GST details.
              </p>
              <div className="grid-2">
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Company / trade name</label>
                  <input
                    required
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>GSTIN</label>
                  <input
                    required
                    placeholder="22AAAAA0000A1Z5"
                    value={signupForm.gstin}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, gstin: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="field">
                  <label>PAN (optional)</label>
                  <input
                    value={signupForm.pan}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, pan: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <input
                    value={signupForm.address}
                    onChange={(e) => setSignupForm({ ...signupForm, address: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>City</label>
                  <input
                    value={signupForm.city}
                    onChange={(e) => setSignupForm({ ...signupForm, city: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>State</label>
                  <select
                    value={signupForm.stateCode}
                    onChange={(e) => setSignupForm({ ...signupForm, stateCode: e.target.value })}
                  >
                    <option value="">From GSTIN / select</option>
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
                    value={signupForm.pincode}
                    onChange={(e) => setSignupForm({ ...signupForm, pincode: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? 'Creating…' : 'Create company account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
