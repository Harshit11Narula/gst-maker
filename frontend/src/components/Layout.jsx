import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { company, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <NavLink to="/" className="brand">
          GST <span>Invoice Maker</span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/company">Company</NavLink>
          <NavLink to="/clients">Clients</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/invoices/new">New invoice</NavLink>
          <NavLink to="/invoices">Invoices</NavLink>
          <button type="button" className="btn btn-ghost" onClick={logout} style={{ padding: '0.4rem 0.9rem' }}>
            Sign out
          </button>
        </nav>
      </header>
      {company && (
        <p className="muted no-print" style={{ marginTop: '-0.8rem', marginBottom: '1.2rem' }}>
          Signed in as <strong style={{ color: 'var(--ink)' }}>{company.name}</strong>
          {company.gstin ? ` · ${company.gstin}` : ''}
        </p>
      )}
      <Outlet />
    </div>
  );
}
