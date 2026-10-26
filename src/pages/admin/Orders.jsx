import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaMagnifyingGlass, FaPen, FaPlus } from 'react-icons/fa6';
import OrderEditor from './OrderEditor.jsx';
import { listOrders, setOrderStatus, onChange, formatAddress } from '../../lib/store.js';
import { STAGES } from './AdminLayout.jsx';

const NEXT = { accepted: ['ready', 'Mark ready'], ready: ['completed', 'Mark completed'] };

export default function Orders() {
  const { status = 'open' } = useParams();
  const [orders, setOrders] = useState(() => listOrders(status));
  const [q, setQ] = useState('');
  const [jainOnly, setJainOnly] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | hydrated order

  useEffect(() => {
    setOrders(listOrders(status));
    return onChange(() => setOrders(listOrders(status)));
  }, [status]);

  const needle = q.trim().toLowerCase();
  const shown = orders.filter((o) => {
    if (jainOnly && !o.jain) return false;
    if (!needle) return true;
    const c = o.customer;
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(needle)
      || (c.phone || '').includes(needle)
      || String(o.id) === needle.replace('#', '');
  });

  const label = STAGES.find((s) => s.key === status)?.label || status;

  return (
    <div className="orders-page">
      <div className="page-head">
        <h1>{label} <span className="muted">· {shown.length} order{shown.length === 1 ? '' : 's'}</span></h1>
        <button className="primary" onClick={() => setEditing('new')}><FaPlus /> New order</button>
      </div>
      <div className="orders-tools">
        <div className="search-box">
          <FaMagnifyingGlass />
          <input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Search name, phone or #id" />
        </div>
        <button className={`tool-chip ${jainOnly ? 'on' : ''}`}
                onClick={() => setJainOnly(!jainOnly)}>
          Jain only
        </button>
      </div>
      {shown.length === 0 && <p className="muted empty">Nothing here right now.</p>}
      <div className="order-grid">
        {shown.map((o) => <OrderCard key={o.id} order={o} onEdit={() => setEditing(o)} />)}
      </div>
      {editing && (
        <OrderEditor order={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

const STAGE_LABELS = { open: 'Placed', accepted: 'Accepted', ready: 'Ready', completed: 'Completed', rejected: 'Rejected' };
const STAGE_ORDER = ['open', 'accepted', 'ready', 'completed', 'rejected'];

function Timeline({ log }) {
  if (!log) return null;
  const steps = STAGE_ORDER.filter((k) => log[k]);
  if (steps.length < 2) return null;
  const fmt = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="timeline">
      {steps.map((k, i) => (
        <span key={k}>{i > 0 && ' → '}{STAGE_LABELS[k]} {fmt(log[k])}</span>
      ))}
    </div>
  );
}

function OrderCard({ order: o, onEdit }) {
  const c = o.customer;
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const next = NEXT[o.status];

  return (
    <article className="order-card">
      <header>
        <div>
          <strong><span className="oid">#{o.id}</span>{c.first_name} {c.last_name}</strong>
          <div className="muted small">{new Date(o.created_at).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
          })}</div>
        </div>
        <div className="order-head-right">
          <div className="order-total">₹{o.total}</div>
          <button className="icon-btn" aria-label="Edit order" title="Edit order" onClick={onEdit}>
            <FaPen />
          </button>
        </div>
      </header>

      <div className="order-addr">
        {o.fulfilment === 'pickup' ? 'Self pickup from the kitchen' : formatAddress(c)}
      </div>
      <div className="order-phone">{c.phone}</div>

      {(o.fulfilment === 'pickup' || o.jain || o.free_from_note || o.reject_reason) && (
        <div className="order-flags">
          {o.fulfilment === 'pickup' && <span className="flag pickup">PICKUP</span>}
          {o.jain && <span className="flag jain">JAIN</span>}
          {o.free_from_note && <span className="flag note">Leave out: {o.free_from_note}</span>}
          {o.reject_reason && <span className="flag rej">Reason: {o.reject_reason}</span>}
        </div>
      )}

      <ul className="order-items">
        {o.items.map((i) => (
          <li key={i.id}>
            <span>
              {i.quantity} × {i.name}
              {i.note && <span className="item-note">↳ {i.note}</span>}
            </span>
            <span>₹{i.quantity * i.unit_price}</span>
          </li>
        ))}
      </ul>

      <Timeline log={o.status_log} />

      <footer>
        {o.status === 'open' && !rejecting && (
          <>
            <button className="primary" onClick={() => setOrderStatus(o.id, 'accepted')}>Accept</button>
            <button className="danger" onClick={() => setRejecting(true)}>Reject</button>
          </>
        )}
        {rejecting && (
          <div className="reject-form">
            <input autoFocus value={reason} onChange={(e) => setReason(e.target.value)}
                   placeholder="Reason, e.g. kitchen at capacity" />
            <div className="reject-actions">
              <button className="danger" onClick={() => setOrderStatus(o.id, 'rejected', { reason })}>
                Reject order
              </button>
              <button className="plain" onClick={() => { setRejecting(false); setReason(''); }}>Cancel</button>
            </div>
          </div>
        )}
        {next && (
          <button className="primary" onClick={() => setOrderStatus(o.id, next[0])}>{next[1]}</button>
        )}
      </footer>
    </article>
  );
}
