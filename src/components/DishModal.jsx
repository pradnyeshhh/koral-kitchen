import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VegMark from './VegMark.jsx';
import Qty from './Qty.jsx';
import { useCart } from '../lib/cart.jsx';

export default function DishModal({ item, onClose }) {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={item.name}
           onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <div className="modal-img-ph" />}
        <div className="modal-body">
          <div className="modal-meta"><VegMark /> <span>{item.category}</span></div>
          <h3>{item.name}</h3>
          <div className="modal-price">₹{item.price}</div>
          <p>{item.description}</p>
          <div className="modal-foot">
            {qty > 0 ? (
              <>
                <Qty value={qty} onChange={(q) => cart.setQty(item.id, q)} />
                <button className="primary" onClick={() => navigate('/checkout')}>
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
