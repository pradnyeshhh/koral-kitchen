import { Link, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { listOrders } from '../lib/store.js';

export default function Confirmation() {
  const { orderId } = useParams();
  const order = useMemo(
    () => listOrders().find((o) => o.id === Number(orderId)),
    [orderId],
  );

  return (
    <div className="page customer confirm">
      <main className="confirm-box">
        <div className="confirm-icon">✓</div>
        <h1>Order placed!</h1>
        {order ? (
          <>
            <p className="muted">Order #{order.id} · ₹{order.total}</p>
            <ul className="confirm-items">
              {order.items.map((i) => <li key={i.id}>{i.quantity} × {i.name}</li>)}
            </ul>
          </>
        ) : <p className="muted">Order not found.</p>}
        <p>The chef will confirm your order on <strong>WhatsApp</strong> shortly.</p>
        <Link to="/demo" className="primary as-link">Back to menu</Link>
      </main>
    </div>
  );
}
