import { useEffect, useState } from 'react';
import {
  listCustomers, listOrdersForPhone, formatAddress, onChange,
  createCustomer, updateCustomerByPhone, deleteCustomerByPhone, TOWERS,
} from '../../lib/store.js';
import { FaMagnifyingGlass, FaChevronDown, FaPen, FaPlus, FaRegTrashCan, FaXmark } from 'react-icons/fa6';
import { composeAddress, addressParts } from '../../lib/address.js';
import OrderEditor from './OrderEditor.jsx';

export default function Customers() {
  const [customers, setCustomers] = useState(listCustomers);
  const [q, setQ] = useState('');
  const [jainOnly, setJainOnly] = useState(false);
  const [area, setArea] = useState(null); // null | 'lodha' | 'outside'
  const [openPhone, setOpenPhone] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | customer
  const [ordering, setOrdering] = useState(null); // customer to create an order for

  useEffect(() => onChange(() => setCustomers(listCustomers())), []);

  const needle = q.trim().toLowerCase();
  const shown = customers.filter((c) => {
    if (jainOnly && !c.jain_default) return false;
    if (area === 'lodha' && c.customer_type !== 'lodha') return false;
    if (area === 'outside' && c.customer_type === 'lodha') return false;
    if (!needle) return true;
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(needle)
      || (c.phone || '').includes(needle);
  });

  const remove = (c) => {
    if (window.confirm(`Delete ${c.first_name} ${c.last_name} and their order history?`)) {
      deleteCustomerByPhone(c.phone);
    }
  };

  return (
    <div className="orders-page">
      <div className="page-head">
        <h1>Customers <span className="muted">· {shown.length}</span></h1>
        <button className="primary" onClick={() => setEditing('new')}><FaPlus /> New customer</button>
      </div>
      <div className="orders-tools">
        <div className="search-box">
          <FaMagnifyingGlass />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" />
        </div>
        <button className={`tool-chip ${jainOnly ? 'on' : ''}`} onClick={() => setJainOnly(!jainOnly)}>
          Jain only
        </button>
        <button className={`tool-chip ${area === 'lodha' ? 'on' : ''}`}
                onClick={() => setArea(area === 'lodha' ? null : 'lodha')}>
          Lodha Park
        </button>
        <button className={`tool-chip ${area === 'outside' ? 'on' : ''}`}
                onClick={() => setArea(area === 'outside' ? null : 'outside')}>
          Outside
        </button>
      </div>
      {shown.length === 0 && <p className="muted empty">No customers match.</p>}
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
                <div className="cust-actions">
                  <button className="cust-toggle cust-order" title="Create an order for this customer"
                          onClick={() => setOrdering(c)}><FaPlus /> Order</button>
                  <button className="icon-btn" aria-label="Edit customer" title="Edit customer"
                          onClick={() => setEditing(c)}><FaPen /></button>
                  <button className="icon-btn danger-icon" aria-label="Delete customer" title="Delete customer"
                          onClick={() => remove(c)}><FaRegTrashCan /></button>
                  <button className={`cust-toggle ${openPhone === c.phone ? 'open' : ''}`}
                          onClick={() => setOpenPhone(openPhone === c.phone ? null : c.phone)}>
                    Past orders <FaChevronDown />
                  </button>
                </div>
              </div>
            </div>
            {openPhone === c.phone && <PastOrders phone={c.phone} />}
          </article>
        ))}
      </div>
      {editing && (
        <CustomerModal customer={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {ordering && (
        <OrderEditor customer={ordering} onClose={() => setOrdering(null)} />
      )}
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
            {o.fulfilment === 'pickup' && 'Self pickup · '}
            {o.items.map((i) => `${i.quantity} × ${i.name}${i.note ? ` (${i.note})` : ''}`).join(', ')}
          </div>
          {(o.jain || o.free_from_note) && (
            <div className="po-custom">
              {o.jain && <span className="flag jain">JAIN</span>}
              {o.free_from_note && <span className="flag note">Leave out: {o.free_from_note}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CustomerModal({ customer, onClose }) {
  const isEdit = !!customer;
  const [f, setF] = useState(() => ({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    phone: customer?.phone || '',
    customer_type: customer?.customer_type || 'lodha',
    tower: customer?.tower || TOWERS[0],
    wing: customer?.wing || 'A',
    apartment: customer?.apartment || '',
    ...addressParts(customer),
    jain_default: !!customer?.jain_default,
  }));
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setError('');
    setF((s) => ({ ...s, [k]: v }));
  };

  const save = () => {
    if (!f.first_name.trim()) { setError('Please enter a name.'); return; }
    const phone = f.phone.replace(/\D/g, '').slice(-10);
    if (!/^\d{10}$/.test(phone)) { setError('Please enter a 10-digit phone number.'); return; }
    if (f.customer_type === 'other') {
      if (!f.flat_no.trim() || !f.building.trim() || !f.street.trim()) {
        setError('Please fill flat no., building and street / area.'); return;
      }
      if (f.pincode && !/^\d{6}$/.test(f.pincode)) { setError('Pincode should be 6 digits.'); return; }
    }
    const data = {
      first_name: f.first_name.trim(), last_name: f.last_name.trim(), phone,
      customer_type: f.customer_type,
      tower: f.customer_type === 'lodha' ? f.tower : null,
      wing: f.customer_type === 'lodha' ? f.wing : null,
      apartment: f.customer_type === 'lodha' ? f.apartment : null,
      flat_no: f.customer_type === 'other' ? f.flat_no.trim() : null,
      building: f.customer_type === 'other' ? f.building.trim() : null,
      street: f.customer_type === 'other' ? f.street.trim() : null,
      landmark: f.customer_type === 'other' ? f.landmark.trim() : null,
      pincode: f.customer_type === 'other' ? f.pincode.trim() : null,
      full_address: f.customer_type === 'other' ? composeAddress(f) : null,
      jain_default: f.jain_default,
    };
    if (isEdit) {
      updateCustomerByPhone(customer.phone, data);
    } else {
      const res = createCustomer(data);
      if (res.error) { setError(res.error); return; }
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal oe" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}><FaXmark /></button>
        <div className="modal-body">
          <h3>{isEdit ? `Edit ${customer.first_name} ${customer.last_name}` : 'New customer'}</h3>
          <div className="row2" style={{ marginTop: 14 }}>
            <label>First name<input value={f.first_name} onChange={set('first_name')} /></label>
            <label>Last name<input value={f.last_name} onChange={set('last_name')} /></label>
          </div>
          <label>Phone<input inputMode="numeric" value={f.phone} onChange={set('phone')} placeholder="10-digit number" /></label>
          <div className="seg">
            <button type="button" className={f.customer_type === 'lodha' ? 'on' : ''}
                    onClick={() => setF((s) => ({ ...s, customer_type: 'lodha' }))}>Lodha Park</button>
            <button type="button" className={f.customer_type === 'other' ? 'on' : ''}
                    onClick={() => setF((s) => ({ ...s, customer_type: 'other' }))}>Other</button>
          </div>
          {f.customer_type === 'lodha' ? (
            <div className="row3">
              <label>Tower
                <select value={f.tower} onChange={set('tower')}>
                  {TOWERS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>Wing
                <select value={f.wing} onChange={set('wing')}><option>A</option><option>B</option></select>
              </label>
              <label>Apartment
                <input inputMode="numeric" maxLength={4} value={f.apartment}
                       onChange={(e) => { setError(''); setF((s) => ({ ...s, apartment: e.target.value.replace(/\D/g, '') })); }} />
              </label>
            </div>
          ) : (
            <>
              <div className="row2">
                <label>Flat / house no.
                  <input value={f.flat_no} onChange={set('flat_no')} placeholder="e.g. 702" />
                </label>
                <label>Building / society
                  <input value={f.building} onChange={set('building')} placeholder="e.g. Sea Breeze CHS" />
                </label>
              </div>
              <label>Street / area
                <input value={f.street} onChange={set('street')}
                       placeholder="e.g. Senapati Bapat Marg, Lower Parel" />
              </label>
              <div className="row2">
                <label>Landmark <span className="opt">(optional)</span>
                  <input value={f.landmark} onChange={set('landmark')} placeholder="e.g. near Blue Tokai" />
                </label>
                <label>Pincode <span className="opt">(optional)</span>
                  <input inputMode="numeric" maxLength={6} value={f.pincode}
                         onChange={(e) => { setError(''); setF((s) => ({ ...s, pincode: e.target.value.replace(/\D/g, '') })); }}
                         placeholder="e.g. 400013" />
                </label>
              </div>
            </>
          )}
          <label className="check">
            <input type="checkbox" checked={f.jain_default} onChange={set('jain_default')} />
            <span><strong>Jain by default</strong> (orders flagged Jain unless changed)</span>
          </label>
          {error && <p className="error">{error}</p>}
          <div className="oe-foot">
            <button type="button" className="primary" onClick={save}>
              {isEdit ? 'Save changes' : 'Add customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
