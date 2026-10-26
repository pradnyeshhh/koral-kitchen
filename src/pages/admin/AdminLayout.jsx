import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { orderCounts, onChange } from '../../lib/store.js';

export const STAGES = [
  { key: 'open', label: 'Open' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'ready', label: 'Ready to deliver' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminLayout() {
  const [counts, setCounts] = useState(orderCounts);
  useEffect(() => onChange(() => setCounts(orderCounts())), []);

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">K&rsquo;s Kitchen <span>admin</span></div>
        <nav>
          {STAGES.map((s, i) => (
            <NavLink key={s.key} to={i === 0 ? '/' : `/orders/${s.key}`} end
                     className={({ isActive }) => `side-link ${isActive ? 'on' : ''}`}>
              <span>{s.label}</span>
              <span className="count">{counts[s.key] || 0}</span>
            </NavLink>
          ))}
          <div className="side-sep" />
          <NavLink to="/menu" className={({ isActive }) => `side-link ${isActive ? 'on' : ''}`}>
            <span>Menu</span>
          </NavLink>
          <NavLink to="/demo" className="side-link">
            <span>Customer demo ↗</span>
          </NavLink>
        </nav>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
