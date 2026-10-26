import { useEffect, useState } from 'react';
import { listCustomers, listOrdersForPhone, formatAddress, onChange } from '../../lib/store.js';
import { FaMagnifyingGlass, FaChevronDown } from 'react-icons/fa6';

export default function Customers() {
  const [customers, setCustomers] = useState(listCustomers);
  const [q, setQ] = useState('');
  const [openPhone, setOpenPhone] = useState(null);

  useEffect(() => onChange(() => setCustomers(listCustomers())), []);

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? customers.filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(needle)
        || (c.phone || '').includes(needle))
    : customers;

  return (
    <div className="orders-page">
      <h1>Customers <span className="muted">· {shown.length}</span></h1>
      <div className="orders-tools">
        <div className="search-box">
          <FaMagnifyingGlass />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" />
        </div>
      </div>
      {shown.length === 0 && <p className="muted empty">No customers yet.</p>}
      <div className="cust-list">
        {shown.map((c) => (
          <article key={c.phone} className="cust-row">
            <div className="cust-main">
              <div className="cust-info">
                <strong>
                  {c.first_name} {c.last_name}
                  {c.jain_default && <span className="flag jain">JAIN</span>}
                </strong>
                <span className="muted small">{c.phone}</span>
                <span className="muted small">
                  {c.customer_type ? formatAddress(c) : 'No address on file'}
                </span>
              </div>
              <div className="cust-side">
                <span className="muted small">
                  {c.order_count} order{c.order_count === 1 ? '' : 's'} · ₹{c.total_spent}
                </span>
                <button className={`cust-toggle ${openPhone === c.phone ? 'open' : ''}`}
                        onClick={() => setOpenPhone(openPhone === c.phone ? null : c.phone)}>
                  Past orders <FaChevronDown />
                </button>
              </div>
            </div>
            {openPhone === c.phone && <PastOrders phone={c.phone} />}
          </article>
        ))}
      </div>
    </div>
  );
}

function PastOrders({ phone }) {
  const orders = listOrdersForPhone(phone);
  if (!orders.length) return <p className="muted small po-empty">No orders yet.</p>;
  return (
    <div className="po-list">
      {orders.map((o) => (
        <div key={o.id} className="po-row">
          <div className="po-head">
            <span><span className="oid">#{o.id}</span>
              {new Date(o.created_at).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
              })}
            </span>
            <span className={`po-status ${o.status}`}>{o.status}</span>
            <span className="po-total">₹{o.total}</span>
          </div>
          <div className="muted small">
            {o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}
          </div>
        </div>
      ))}
    </div>
  );
}
