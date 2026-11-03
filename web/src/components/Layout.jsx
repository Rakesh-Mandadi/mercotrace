import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const link = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '');

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>Mercotrace</strong>
            <small>Smart Mandi Platform</small>
          </div>
        </div>
        <nav>
          <NavLink to="/dashboard" className={link}>Dashboard</NavLink>
          <NavLink to="/settings/commodities" className={link}>Commodity settings</NavLink>
          <NavLink to="/profile" className={link}>Profile</NavLink>
        </nav>
        <button className="nav-link signout" onClick={async () => { await logout(); nav('/login'); }}>
          Sign out
        </button>
      </aside>
      <main className="content">
        <header className="topbar">
          <span className="who">{user.fullName || user.username}</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
