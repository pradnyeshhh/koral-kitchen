import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMenu, createOrder, findCustomerByPhone, TOWERS, SLOTS } from '../lib/store.js';
import { useCart } from '../lib/cart.jsx';
import Qty from '../components/Qty.jsx';

function composeAddress(f) {
  let a = `${f.flat_no.trim()}, ${f.building.trim()}, ${f.street.trim()}`;
  if (f.landmark.trim()) a += `, ${f.landmark.trim()}`;
  if (f.pincode.trim()) a += `, ${f.pincode.trim()}`;
  return a;
}

export default function Checkout() {
  const cart = useCart();
  const navigate = useNavigate();
  const menu = useMemo(() => listMenu(), []);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '',
    customer_type: 'lodha', tower: TOWERS[0], wing: 'A', apartment: '',
    flat_no: '', building: '', street: '', landmark: '', pincode: '',
    fulfilment: 'delivery', slot: 'ASAP',
    jain: false, free_from_note: '',
  });
  const [error, setError] = useState('');
  const [noteOpen, setNoteOpen] = useState({});

  const lines = useMemo(
    () => menu.filter((m) => cart.items[m.id]).map((m) => ({ ...m, qty: cart.items[m.id] })),
    [menu, cart.items],
  );
  const total = lines.reduce((t, l) => t + l.qty * l.price, 0);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setError('');
    setForm((f) => ({ ...f, [k]: v }));
  };

  // Recognise repeat customers by phone and prefill.
  const onPhoneBlur = () => {
    const c = findCustomerByPhone(form.phone.trim());
    if (!c) return;
    setForm((f) => ({
      ...f,
      first_name: f.first_name || c.first_name || '',
      last_name: f.last_name || c.last_name || '',
      customer_type: c.customer_type || f.customer_type,
      tower: c.tower || f.tower,
      wing: c.wing || f.wing,
      apartment: c.apartment || f.apartment,
      flat_no: c.flat_no || f.flat_no,
      building: c.building || f.building,
      street: c.street || f.street,
      landmark: c.landmark || f.landmark,
      pincode: c.pincode || f.pincode,
      jain: f.jain || !!c.jain_default,
    }));
  };

  const placeOrder = (e) => {
    e.preventDefault();
    if (!lines.length) { setError('Your cart is empty.'); return; }
    if (!form.first_name.trim() || !form.last_name.trim()) { setError('Please enter your name.'); return; }
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

    const order = createOrder({
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
      fulfilment: form.fulfilment,
      slot: form.slot,
      items: lines.map((l) => ({ menu_item_id: l.id, quantity: l.qty, note: cart.notes[l.id] || '' })),
      jain: form.jain,
      freeFromNote: form.free_from_note,
    });
    cart.clear();
    navigate(`/demo/confirmation/${order.id}`);
  };

  return (
    <div className="page customer">
      <header className="sub-header">
        <Link to="/demo" className="back">←</Link>
        <h1>Your order</h1>
      </header>

      <main className="checkout">
        <section className="card">
          <h2 className="card-title">Items</h2>
          {lines.length === 0 && <p className="muted">Cart is empty. <Link to="/demo">Back to menu</Link></p>}
          {lines.map((l) => (
            <div key={l.id} className="cart-line-wrap">
              <div className="cart-line">
                <div className="cart-line-name">{l.name}</div>
                <Qty value={l.qty} onChange={(q) => cart.setQty(l.id, q)} />
                <div className="cart-line-price">₹{l.qty * l.price}</div>
              </div>
              {(noteOpen[l.id] || cart.notes[l.id]) ? (
                <input className="line-note" value={cart.notes[l.id] || ''}
                       onChange={(e) => cart.setNote(l.id, e.target.value)}
                       placeholder='e.g. "less spicy", "no onion"' />
              ) : (
                <button type="button" className="add-note"
                        onClick={() => setNoteOpen((s2) => ({ ...s2, [l.id]: true }))}>
                  + Add note
                </button>
              )}
            </div>
          ))}
          {lines.length > 0 && (
            <div className="cart-total"><span>Total</span><span>₹{total}</span></div>
          )}
        </section>

        <form className="card" onSubmit={placeOrder}>
          <h2 className="card-title">Your details</h2>
          <div className="row2">
            <label>First name
              <input value={form.first_name} onChange={set('first_name')} autoComplete="given-name" />
            </label>
            <label>Last name
              <input value={form.last_name} onChange={set('last_name')} autoComplete="family-name" />
            </label>
          </div>
          <label>Phone (WhatsApp)
            <input inputMode="numeric" value={form.phone} onChange={set('phone')}
                   onBlur={onPhoneBlur} placeholder="10-digit number" autoComplete="tel" />
          </label>
          <p className="hint">All order updates happen on WhatsApp. The chef will message you to confirm.</p>

          <h2 className="card-title">Getting your order</h2>
          <div className="seg">
            <button type="button" className={form.fulfilment === 'delivery' ? 'on' : ''}
                    onClick={() => setForm((f) => ({ ...f, fulfilment: 'delivery' }))}>Delivery</button>
            <button type="button" className={form.fulfilment === 'pickup' ? 'on' : ''}
                    onClick={() => setForm((f) => ({ ...f, fulfilment: 'pickup' }))}>Self pickup</button>
          </div>

          <div className="field">
            <span className="field-label">Time slot</span>
            <div className="opt-chips">
              {SLOTS.map((sl) => (
                <button key={sl} type="button"
                        className={`opt-chip ${form.slot === sl ? 'on' : ''}`}
                        onClick={() => setForm((f) => ({ ...f, slot: sl }))}>
                  {sl}
                </button>
              ))}
            </div>
          </div>

          {form.fulfilment === 'pickup' && (
            <p className="hint">Pick up from the kitchen in Lodha Park. We&rsquo;ll share the exact tower on WhatsApp.</p>
          )}

          {form.fulfilment === 'delivery' && (<>
          <div className="seg">
            <button type="button" className={form.customer_type === 'lodha' ? 'on' : ''}
                    onClick={() => setForm((f) => ({ ...f, customer_type: 'lodha' }))}>Lodha Park resident</button>
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
                <select value={form.wing} onChange={set('wing')}>
                  <option>A</option><option>B</option>
                </select>
              </label>
              <label>Apartment
                <input inputMode="numeric" maxLength={4} value={form.apartment}
                       onChange={(e) => { setError(''); setForm((f) => ({ ...f, apartment: e.target.value.replace(/\D/g, '') })); }}
                       placeholder="e.g. 1204" />
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

          <h2 className="card-title">Kitchen notes</h2>
          <label className="check">
            <input type="checkbox" checked={form.jain} onChange={set('jain')} />
            <span><strong>Jain preparation</strong> (no onion, garlic or root vegetables)</span>
          </label>

          <label>Anything to leave out?
            <input value={form.free_from_note} onChange={set('free_from_note')}
                   placeholder='e.g. "no onion, no coriander"' />
          </label>

          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary" disabled={!lines.length}>
            Place order · ₹{total}
          </button>
        </form>
      </main>
    </div>
  );
}
