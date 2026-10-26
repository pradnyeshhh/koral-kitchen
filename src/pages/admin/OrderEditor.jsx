import { useEffect, useMemo, useState } from 'react';
import { listMenu, createOrder, updateOrderContents, formatAddress, listCustomers, TOWERS } from '../../lib/store.js';
import { composeAddress, addressParts } from '../../lib/address.js';
import Qty from '../../components/Qty.jsx';
import { FaXmark, FaMagnifyingGlass } from 'react-icons/fa6';

export default function OrderEditor({ order, customer: initialCustomer = null, onClose }) {
  const isEdit = !!order;
  const menu = useMemo(() => listMenu(), []);
  const [lines, setLines] = useState(() => (isEdit
    ? order.items.map((i) => ({
        menu_item_id: i.menu_item_id, name: i.name,
        quantity: i.quantity, unit_price: i.unit_price, note: i.note || '',
      }))
    : []));
  const [q, setQ] = useState('');
  const [custQ, setCustQ] = useState('');
  const [form, setForm] = useState(() => ({
    first_name: initialCustomer?.first_name || '',
    last_name: initialCustomer?.last_name || '',
    phone: initialCustomer?.phone || '',
    customer_type: initialCustomer?.customer_type || 'lodha',
    tower: initialCustomer?.tower || TOWERS[0],
    wing: initialCustomer?.wing || 'A',
    apartment: initialCustomer?.apartment || '',
    ...(initialCustomer
      ? addressParts(initialCustomer)
      : { flat_no: '', building: '', street: '', landmark: '', pincode: '' }),
    fulfilment: order?.fulfilment || 'delivery',
    jain: order?.jain || !!initialCustomer?.jain_default,
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

  const custNeedle = custQ.trim().toLowerCase();
  const custResults = custNeedle
    ? listCustomers().filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(custNeedle)
        || (c.phone || '').includes(custNeedle)).slice(0, 5)
    : [];
  const pickCustomer = (c) => {
    setForm((f) => ({
      ...f,
      first_name: c.first_name || '', last_name: c.last_name || '', phone: c.phone || '',
      customer_type: c.customer_type || 'lodha',
      tower: c.tower || TOWERS[0], wing: c.wing || 'A', apartment: c.apartment || '',
      ...addressParts(c),
      jain: !!c.jain_default,
    }));
    setCustQ('');
    setError('');
  };

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
      if (form.customer_type === 'other') {
        if (!form.flat_no.trim() || !form.building.trim() || !form.street.trim()) {
          setError('Please fill flat no., building and street / area.'); return;
        }
        if (form.pincode && !/^\d{6}$/.test(form.pincode)) { setError('Pincode should be 6 digits.'); return; }
      }
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
          flat_no: form.customer_type === 'other' ? form.flat_no.trim() : null,
          building: form.customer_type === 'other' ? form.building.trim() : null,
          street: form.customer_type === 'other' ? form.street.trim() : null,
          landmark: form.customer_type === 'other' ? form.landmark.trim() : null,
          pincode: form.customer_type === 'other' ? form.pincode.trim() : null,
          full_address: form.customer_type === 'other' ? composeAddress(form) : null,
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
          {!isEdit && initialCustomer && (
            <p className="muted small oe-cust">
              for {initialCustomer.first_name} {initialCustomer.last_name} · {initialCustomer.phone}
            </p>
          )}
          {isEdit && (
            <p className="muted small oe-cust">
              {order.customer.first_name} {order.customer.last_name} · {order.customer.phone}
              {order.fulfilment !== 'pickup' && ` · ${formatAddress(order.customer)}`}
            </p>
          )}

          {!isEdit && (
            <div className="field">
              <span className="field-label">Customer</span>
              <div className="search-box oe-search">
                <FaMagnifyingGlass />
                <input value={custQ} onChange={(e) => setCustQ(e.target.value)}
                       placeholder="Search existing customers..." />
              </div>
              {custResults.length > 0 && (
                <div className="oe-results">
                  {custResults.map((c) => (
                    <button key={c.phone} type="button" onClick={() => pickCustomer(c)}>
                      <span>{c.first_name} {c.last_name}{c.jain_default ? ' · Jain' : ''}</span>
                      <span className="muted">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
              <>
                <div className="row2">
                  <label>Flat / house no.
                    <input value={form.flat_no} onChange={set('flat_no')} placeholder="e.g. 702" />
                  </label>
                  <label>Building / society
                    <input value={form.building} onChange={set('building')} placeholder="e.g. Sea Breeze CHS" />
                  </label>
                </div>
                <label>Street / area
                  <input value={form.street} onChange={set('street')}
                         placeholder="e.g. Senapati Bapat Marg, Lower Parel" />
                </label>
                <div className="row2">
                  <label>Landmark <span className="opt">(optional)</span>
                    <input value={form.landmark} onChange={set('landmark')} placeholder="e.g. near Blue Tokai" />
                  </label>
                  <label>Pincode <span className="opt">(optional)</span>
                    <input inputMode="numeric" maxLength={6} value={form.pincode}
                           onChange={(e) => { setError(''); setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '') })); }}
                           placeholder="e.g. 400013" />
                  </label>
                </div>
              </>
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
