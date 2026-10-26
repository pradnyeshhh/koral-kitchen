import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMenu, onChange } from '../lib/store.js';
import { CATEGORIES } from '../data/seed.js';
import { useCart } from '../lib/cart.jsx';
import VegMark from '../components/VegMark.jsx';
import DishModal from '../components/DishModal.jsx';
import { FaInstagram, FaXmark } from 'react-icons/fa6';
import Qty from '../components/Qty.jsx';

export default function Menu() {
  const [menu, setMenu] = useState(() => listMenu({ availableOnly: true }));
  const [filter, setFilter] = useState(null);
  const [detail, setDetail] = useState(null);
  const cart = useCart();
  const navigate = useNavigate();

  useEffect(() => onChange(() => setMenu(listMenu({ availableOnly: true }))), []);

  const byCategory = useMemo(() => {
    const groups = {};
    CATEGORIES.forEach((c) => { groups[c] = []; });
    menu.forEach((m) => { (groups[m.category] || (groups[m.category] = [])).push(m); });
    return groups;
  }, [menu]);

  const cartTotal = useMemo(() => {
    let t = 0;
    menu.forEach((m) => { t += (cart.items[m.id] || 0) * m.price; });
    return t;
  }, [menu, cart.items]);

  return (
    <div className="page customer">
      <header className="brand-header">
        <div className="brand-row">
          <div className="brand-mono">K</div>
          <div>
            <div className="brand-name">K&rsquo;s Kitchen <span>by Koral</span></div>
            <div className="brand-tag">Home-cooked in Mumbai</div>
          </div>
        </div>
        <div className="hero-badges">
          <span className="badge"><VegMark /> 100% Vegetarian</span>
          <span className="badge">Jain friendly</span>
          <span className="badge">Orders via WhatsApp</span>
        </div>
      </header>

      <nav className="chips">
        {CATEGORIES.map((c) => (
          byCategory[c]?.length ? (
            <button key={c} className={`chip ${filter === c ? 'on' : ''}`}
                    onClick={() => setFilter(filter === c ? null : c)}>
              {c}{filter === c && <FaXmark />}
            </button>
          ) : null
        ))}
      </nav>

      <main className="menu-list">
        {CATEGORIES.filter((c) => !filter || filter === c).map((c) => (
          byCategory[c]?.length ? (
            <section key={c} className="menu-section">
              <h2>{c}</h2>
              {byCategory[c].map((m) => (
                <article key={m.id} className="dish-card"
                         onClick={() => setDetail(m)}>
                  <div className="dish-info">
                    <VegMark />
                    <h3>{m.name}</h3>
                    <div className="dish-price">₹{m.price}</div>
                    <p>{m.description}</p>
                  </div>
                  <div className="dish-side">
                    {m.photo
                      ? <img src={m.photo} alt={m.name} loading="lazy"
                             onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                      : <div className="img-ph" />}
                    {cart.items[m.id]
                      ? <span style={{ display: 'contents' }} onClick={(e) => e.stopPropagation()}>
                          <Qty value={cart.items[m.id]} onChange={(q) => cart.setQty(m.id, q)} />
                        </span>
                      : <button className="add-btn"
                                onClick={(e) => { e.stopPropagation(); cart.add(m.id); }}>ADD</button>}
                  </div>
                </article>
              ))}
            </section>
          ) : null
        ))}
        <footer className="site-footer">
          <a href="https://www.instagram.com/kskitchen_by_koral_/" target="_blank" rel="noreferrer">
            <FaInstagram /> @kskitchen_by_koral_
          </a>
          <div>We confirm every order on WhatsApp.</div>
        </footer>
      </main>

      {detail && <DishModal item={detail} onClose={() => setDetail(null)} />}

      {cart.count > 0 && (
        <button className="cart-bar" onClick={() => navigate('/demo/checkout')}>
          <span>{cart.count} item{cart.count > 1 ? 's' : ''} · ₹{cartTotal}</span>
          <span className="cart-bar-cta">View cart →</span>
        </button>
      )}
    </div>
  );
}
