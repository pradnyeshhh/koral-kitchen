import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FaBars } from 'react-icons/fa6';
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
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => onChange(() => setCounts(orderCounts())), []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const close = () => setNavOpen(false);

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-topbar">
          <button className="nav-burger" aria-label="Open menu" onClick={() => setNavOpen(true)}>
            <FaBars />
          </button>
          <div className="admin-brand">K&rsquo;s Kitchen <span>admin</span></div>
        </div>
        <div className={`admin-nav-wrap ${navOpen ? 'open' : ''}`} onClick={close}>
          <nav onClick={(e) => e.stopPropagation()}>
            <div className="drawer-title">K&rsquo;s Kitchen <span>admin</span></div>
            {STAGES.map((s, i) => (
              <NavLink key={s.key} to={i === 0 ? '/' : `/orders/${s.key}`} end onClick={close}
                       className={({ isActive }) => `side-link ${isActive ? 'on' : ''}`}>
                <span>{s.label}</span>
                <span className="count">{counts[s.key] || 0}</span>
              </NavLink>
            ))}
            <div className="side-sep" />
            <NavLink to="/menu" onClick={close}
                     className={({ isActive }) => `side-link ${isActive ? 'on' : ''}`}>
              <span>Menu</span>
            </NavLink>
            <NavLink to="/customers" onClick={close}
                     className={({ isActive }) => `side-link ${isActive ? 'on' : ''}`}>
              <span>Customers</span>
            </NavLink>
            <NavLink to="/demo" onClick={close} className="side-link">
              <span>Customer demo ↗</span>
            </NavLink>
          </nav>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
