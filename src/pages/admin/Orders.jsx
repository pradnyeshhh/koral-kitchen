import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listOrders, setOrderStatus, onChange, formatAddress } from '../../lib/store.js';
import { STAGES } from './AdminLayout.jsx';
import { FaWhatsapp } from 'react-icons/fa6';

const NEXT = { accepted: ['ready', 'Mark ready'], ready: ['completed', 'Mark completed'] };

export default function Orders() {
  const { status = 'open' } = useParams();
  const [orders, setOrders] = useState(() => listOrders(status));

  useEffect(() => {
    setOrders(listOrders(status));
    return onChange(() => setOrders(listOrders(status)));
  }, [status]);

  const label = STAGES.find((s) => s.key === status)?.label || status;

  return (
    <div className="orders-page">
      <h1>{label} <span className="muted">· {orders.length} order{orders.length === 1 ? '' : 's'}</span></h1>
      {orders.length === 0 && <p className="muted empty">Nothing here right now.</p>}
      <div className="order-grid">
        {orders.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}

function OrderCard({ order: o }) {
  const c = o.customer;
  const wa = `https://wa.me/91${c.phone}?text=${encodeURIComponent(`Hi ${c.first_name}, about your K's Kitchen order #${o.id}: `)}`;
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
        <div className="order-total">₹{o.total}</div>
      </header>

      <div className="order-addr">{formatAddress(c)}</div>
      <div className="order-phone">
        <span>{c.phone}</span>
        <a className="wa-btn" href={wa} target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>
      </div>

      {(o.jain || o.free_from_note) && (
        <div className="order-flags">
          {o.jain && <span className="flag jain">JAIN</span>}
          {o.free_from_note && <span className="flag note">Leave out: {o.free_from_note}</span>}
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

      <footer>
        {o.status === 'open' && (
          <>
            <button className="primary" onClick={() => setOrderStatus(o.id, 'accepted')}>Accept</button>
            <button className="danger" onClick={() => setOrderStatus(o.id, 'rejected')}>Reject</button>
          </>
        )}
        {next && (
          <button className="primary" onClick={() => setOrderStatus(o.id, next[0])}>{next[1]}</button>
        )}
      </footer>
    </article>
  );
}
