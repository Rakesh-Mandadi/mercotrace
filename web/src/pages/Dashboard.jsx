import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.getDashboard().then(setStats).catch((e) => setError(e.message)); }, []);

  const cards = stats && [
    ['Commodities', stats.commodities, 'blue'],
    ['With HSN code', stats.withHsn, 'green'],
    ['Deduction enabled', stats.deductionEnabled, 'purple'],
    ['Hamali enabled', stats.hamaliEnabled, 'amber'],
  ];

  return (
    <>
      <h2 className="page-title">Welcome back, {user.fullName || user.username}</h2>
      {error && <p className="error">{error}</p>}
      <div className="stats">
        {cards ? cards.map(([label, value, tone]) => (
          <div key={label} className={`stat ${tone}`}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        )) : !error && <p>Loading…</p>}
      </div>
      {stats && stats.commodities === 0 && (
        <p className="empty">No commodities yet. <Link to="/settings/commodities">Add your first commodity</Link></p>
      )}
    </>
  );
}
