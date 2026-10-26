import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VegMark from './VegMark.jsx';
import Qty from './Qty.jsx';
import { useCart } from '../lib/cart.jsx';
import { getCategoryOptions } from '../lib/store.js';
import { FaXmark } from 'react-icons/fa6';

export default function DishModal({ item, onClose, closed, onBlocked }) {
  const cart = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const qty = cart.items[item.id] || 0;
  const quickOptions = getCategoryOptions(item.category);
  const note = cart.notes[item.id] || '';
  const parts = note.split(',').map((x) => x.trim()).filter(Boolean);
  const hasOpt = (o) => parts.some((x) => x.toLowerCase() === o.toLowerCase());
  const toggleOpt = (o) => {
    const next = hasOpt(o)
      ? parts.filter((x) => x.toLowerCase() !== o.toLowerCase())
      : [...parts, o];
    cart.setNote(item.id, next.join(', '));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={item.name}
           onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}><FaXmark /></button>
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <div className="modal-img-ph" />}
        <div className="modal-body">
          <div className="modal-meta"><VegMark /> <span>{item.category}</span></div>
          <h3>{item.name}</h3>
          <div className="modal-price">₹{item.price}</div>
          <p>{item.description}</p>
          <div className="modal-note">
            <span className="field-label">Customise <span className="opt">(optional)</span></span>
            <div className="opt-chips">
              {quickOptions.map((o) => (
                <button key={o} type="button"
                        className={`opt-chip ${hasOpt(o) ? 'on' : ''}`}
                        onClick={() => toggleOpt(o)}>
                  {o}
                </button>
              ))}
            </div>
            <input value={note}
                   onChange={(e) => cart.setNote(item.id, e.target.value)}
                   placeholder="Anything else for the chef?" />
          </div>
          <div className="modal-foot">
            {qty > 0 ? (
              <>
                <Qty value={qty} onChange={(q) => cart.setQty(item.id, q)} />
                <button className="primary"
                        onClick={() => { if (closed) { onBlocked?.(); return; } navigate('/demo/checkout'); }}>
                  View cart →
                </button>
              </>
            ) : (
              <button className="primary" onClick={() => cart.add(item.id)}>
                Add to cart · ₹{item.price}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
