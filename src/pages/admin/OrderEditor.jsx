import { useEffect, useMemo, useState } from 'react';
import { listMenu, createOrder, updateOrderContents, formatAddress, TOWERS } from '../../lib/store.js';
import Qty from '../../components/Qty.jsx';
import { FaXmark, FaMagnifyingGlass } from 'react-icons/fa6';

export default function OrderEditor({ order, onClose }) {
  const isEdit = !!order;
  const menu = useMemo(() => listMenu(), []);
  const [lines, setLines] = useState(() => (isEdit
    ? order.items.map((i) => ({
        menu_item_id: i.menu_item_id, name: i.name,
        quantity: i.quantity, unit_price: i.unit_price, note: i.note || '',
      }))
    : []));
  const [q, setQ] = useState('');
  const [form, setForm] = useState(() => ({
    first_name: '', last_name: '', phone: '',
    customer_type: 'lodha', tower: TOWERS[0], wing: 'A', apartment: '', full_address: '',
    fulfilment: order?.fulfilment || 'delivery',
    jain: order?.jain || false,
    free_from_note: order?.free_from_note || '',
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

  const needle = q.trim().toLowerCase();
  const results = needle
    ? menu.filter((m) => m.name.toLowerCase().includes(needle)
        || (m.category || '').toLowerCase().includes(needle)).slice(0, 6)
    : [];
  const total = lines.reduce((t, l) => t + l.quantity * l.unit_price, 0);

  const addItem = (m) => {
    setLines((ls) => {
      const existing = ls.find((l) => l.menu_item_id === m.id);
      if (existing) {
        return ls.map((l) => (l.menu_item_id === m.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...ls, { menu_item_id: m.id, name: m.name, quantity: 1, unit_price: m.price, note: '' }];
    });
    setQ('');
    setError('');
  };
  const setLine = (mid, patch) => {
    setLines((ls) => ls
      .map((l) => (l.menu_item_id === mid ? { ...l, ...patch } : l))
      .filter((l) => l.quantity > 0));
  };
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setError('');
    setForm((f) => ({ ...f, [k]: v }));
  };

  const save = () => {
    if (!lines.length) { setError('Add at least one item.'); return; }
    if (isEdit) {
      updateOrderContents(order.id, {
        items: lines.map((l) => ({ menu_item_id: l.menu_item_id, quantity: l.quantity, note: l.note })),
        jain: form.jain, freeFromNote: form.free_from_note, fulfilment: form.fulfilment,
      });
      onClose();
      return;
    }
    if (!form.first_name.trim()) { setError('Please enter the customer’s name.'); return; }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, '').slice(-10))) { setError('Please enter a 10-digit phone number.'); return; }
    if (form.fulfilment === 'delivery') {
      if (form.customer_type === 'lodha' && !/^\d{1,4}$/.test(form.apartment)) { setError('Apartment number should be up to 4 digits.'); return; }
      if (form.customer_type === 'other' && !form.full_address.trim()) { setError('Please enter the address.'); return; }
    }
    createOrder({
      customer: {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.replace(/\D/g, '').slice(-10),
        ...(form.fulfilment === 'delivery' ? {
          customer_type: form.customer_type,
          tower: form.customer_type === 'lodha' ? form.tower : null,
          wing: form.customer_type === 'lodha' ? form.wing : null,
          apartment: form.customer_type === 'lodha' ? form.apartment : null,
          full_address: form.customer_type === 'other' ? form.full_address.trim() : null,
        } : {}),
      },
      items: lines.map((l) => ({ menu_item_id: l.menu_item_id, quantity: l.quantity, note: l.note })),
      jain: form.jain,
      freeFromNote: form.free_from_note,
      fulfilment: form.fulfilment,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal oe" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}><FaXmark /></button>
        <div className="modal-body">
          <h3>{isEdit ? `Edit order #${order.id}` : 'New order'}</h3>
          {isEdit && (
            <p className="muted small oe-cust">
              {order.customer.first_name} {order.customer.last_name} · {order.customer.phone}
              {order.fulfilment !== 'pickup' && ` · ${formatAddress(order.customer)}`}
            </p>
          )}

          <div className="field">
            <span className="field-label">Items</span>
            {lines.map((l) => (
              <div key={l.menu_item_id} className="oe-line">
                <div className="oe-line-main">
                  <span className="oe-line-name">{l.name}</span>
                  <Qty value={l.quantity} onChange={(v) => setLine(l.menu_item_id, { quantity: v })} />
                  <span className="oe-line-price">₹{l.quantity * l.unit_price}</span>
                </div>
                <input className="line-note" value={l.note} placeholder="Note, e.g. less spicy"
                       onChange={(e) => setLine(l.menu_item_id, { note: e.target.value })} />
              </div>
            ))}
            <div className="search-box oe-search">
              <FaMagnifyingGlass />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a dish..." />
            </div>
            {results.length > 0 && (
              <div className="oe-results">
                {results.map((m) => (
                  <button key={m.id} type="button" onClick={() => addItem(m)}>
                    <span>{m.name}</span><span className="muted">₹{m.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isEdit && (<>
            <div className="row2">
              <label>First name<input value={form.first_name} onChange={set('first_name')} /></label>
              <label>Last name<input value={form.last_name} onChange={set('last_name')} /></label>
            </div>
            <label>Phone<input inputMode="numeric" value={form.phone} onChange={set('phone')} placeholder="10-digit number" /></label>
          </>)}

          <div className="seg">
            <button type="button" className={form.fulfilment === 'delivery' ? 'on' : ''}
                    onClick={() => setForm((f) => ({ ...f, fulfilment: 'delivery' }))}>Delivery</button>
            <button type="button" className={form.fulfilment === 'pickup' ? 'on' : ''}
                    onClick={() => setForm((f) => ({ ...f, fulfilment: 'pickup' }))}>Self pickup</button>
          </div>

          {!isEdit && form.fulfilment === 'delivery' && (<>
            <div className="seg">
              <button type="button" className={form.customer_type === 'lodha' ? 'on' : ''}
                      onClick={() => setForm((f) => ({ ...f, customer_type: 'lodha' }))}>Lodha Park</button>
              <button type="button" className={form.customer_type === 'other' ? 'on' : ''}
                      onClick={() => setForm((f) => ({ ...f, customer_type: 'other' }))}>Other</button>
            </div>
            {form.customer_type === 'lodha' ? (
              <div className="row3">
                <label>Tower
                  <select value={form.tower} onChange={set('tower')}>
                    {TOWERS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label>Wing
                  <select value={form.wing} onChange={set('wing')}><option>A</option><option>B</option></select>
                </label>
                <label>Apartment
                  <input inputMode="numeric" maxLength={4} value={form.apartment}
                         onChange={(e) => { setError(''); setForm((f) => ({ ...f, apartment: e.target.value.replace(/\D/g, '') })); }} />
                </label>
              </div>
            ) : (
              <label>Address<textarea rows={2} value={form.full_address} onChange={set('full_address')} /></label>
            )}
          </>)}

          <label className="check">
            <input type="checkbox" checked={form.jain} onChange={set('jain')} />
            <span><strong>Jain preparation</strong> (no onion, garlic or root vegetables)</span>
          </label>
          <label>Leave out
            <input value={form.free_from_note} onChange={set('free_from_note')} placeholder='e.g. "no coriander"' />
          </label>

          {error && <p className="error">{error}</p>}
          <div className="oe-foot">
            <span className="oe-total">Total ₹{total}</span>
            <button type="button" className="primary" onClick={save}>
              {isEdit ? 'Save changes' : 'Create order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
