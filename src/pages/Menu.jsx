import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMenu, onChange, getSettings } from '../lib/store.js';
import { CATEGORIES } from '../data/seed.js';
import { useCart } from '../lib/cart.jsx';
import VegMark from '../components/VegMark.jsx';
import DishModal from '../components/DishModal.jsx';
import { FaInstagram, FaXmark, FaMagnifyingGlass } from 'react-icons/fa6';
import Qty from '../components/Qty.jsx';

export default function Menu() {
  const [menu, setMenu] = useState(() => listMenu({ availableOnly: true }));
  const [settings, setSettings] = useState(getSettings);
  const [filter, setFilter] = useState(null);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const cart = useCart();

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  };
  const closed = !settings.kitchen_open;
  const blockedToast = () => showToast('We\u2019re closed right now. Ordering reopens soon.');
  const navigate = useNavigate();

  useEffect(() => onChange(() => { setMenu(listMenu({ availableOnly: true })); setSettings(getSettings()); }), []);

  const needle = q.trim().toLowerCase();
  const byCategory = useMemo(() => {
    const groups = {};
    CATEGORIES.forEach((c) => { groups[c] = []; });
    menu
      .filter((m) => !needle
        || m.name.toLowerCase().includes(needle)
        || (m.description || '').toLowerCase().includes(needle)
        || (m.category || '').toLowerCase().includes(needle))
      .forEach((m) => { (groups[m.category] || (groups[m.category] = [])).push(m); });
    return groups;
  }, [menu, needle]);
  const anyShown = CATEGORIES.some((c) => byCategory[c]?.length && (!filter || filter === c));

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
            <div className="brand-name">K&rsquo;s Kitchen</div>
            <div className="brand-tag">Home-cooked in Mumbai</div>
          </div>
        </div>
        <div className="hero-status">
          <span className={`status-dot ${closed ? '' : 'live'}`} />
          <span>{closed ? 'Closed right now' : 'Open now'}</span>
          <span className="dot-sep">·</span>
          <span>Pure veg kitchen</span>
          <span className="dot-sep">·</span>
          <span>Delivery &amp; self pickup</span>
        </div>
      </header>

      {!settings.kitchen_open && (
        <div className="closed-banner">
          We&rsquo;re closed right now. Browse the menu; ordering reopens soon.
        </div>
      )}

      <div className="menu-search">
        <div className="search-box">
          <FaMagnifyingGlass />
          <input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Search dishes" />
          {q && (
            <button aria-label="Clear search" className="search-clear" onClick={() => setQ('')}>
              <FaXmark />
            </button>
          )}
        </div>
      </div>

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
        {!anyShown && (
          <p className="muted no-results">Nothing matches &ldquo;{q}&rdquo;. Try another dish.</p>
        )}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (closed) { blockedToast(); return; }
                                  cart.add(m.id);
                                }}>ADD</button>}
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

      {detail && <DishModal item={detail} onClose={() => setDetail(null)}
                            closed={closed} onBlocked={blockedToast} />}

      {toast && <div className="toast">{toast}</div>}

      {cart.count > 0 && (
        <button className="cart-bar" onClick={() => navigate('/demo/checkout')}>
          <span>{cart.count} item{cart.count > 1 ? 's' : ''} · ₹{cartTotal}</span>
          <span className="cart-bar-cta">View cart →</span>
        </button>
      )}
    </div>
  );
}
