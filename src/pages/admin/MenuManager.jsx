import { useEffect, useState } from 'react';
import {
  listMenu, createMenuItem, updateMenuItem, deleteMenuItem, onChange,
  getCategoryOptions, setCategoryOptions,
} from '../../lib/store.js';
import { CATEGORIES } from '../../data/seed.js';
import ImageDrop from '../../components/ImageDrop.jsx';
import { FaMagnifyingGlass, FaXmark, FaChevronDown } from 'react-icons/fa6';

const EMPTY = { name: '', description: '', price: '', photo: '', category: CATEGORIES[0], available: true };

export default function MenuManager() {
  const [menu, setMenu] = useState(listMenu);
  const [editing, setEditing] = useState(null); // null | 'new' | item id
  const [q, setQ] = useState('');

  useEffect(() => onChange(() => setMenu(listMenu())), []);

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? menu.filter((m) =>
        m.name.toLowerCase().includes(needle)
        || (m.category || '').toLowerCase().includes(needle)
        || (m.description || '').toLowerCase().includes(needle))
    : menu;

  const save = (form) => {
    if (editing === 'new') createMenuItem(form);
    else updateMenuItem(editing, form);
    setEditing(null);
  };

  const remove = (item) => {
    if (window.confirm(`Delete "${item.name}" from the menu?`)) deleteMenuItem(item.id);
  };

  return (
    <div className="orders-page">
      <div className="page-head">
        <h1>Menu <span className="muted">· {shown.length} item{shown.length === 1 ? '' : 's'}</span></h1>
        <button className="primary" onClick={() => setEditing('new')}>+ Add item</button>
      </div>

      <div className="orders-tools">
        <div className="search-box">
          <FaMagnifyingGlass />
          <input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Search dishes or categories" />
        </div>
      </div>

      <CategoryOptionsEditor />

      {editing === 'new' && <ItemForm initial={EMPTY} onSave={save} onCancel={() => setEditing(null)} />}

      {shown.length === 0 && <p className="muted empty">No dishes match.</p>}
      <div className="mi-list">
        {shown.map((m) => (
          editing === m.id
            ? <ItemForm key={m.id} initial={m} onSave={save} onCancel={() => setEditing(null)} />
            : (
              <article key={m.id} className={`mi-row ${m.available ? '' : 'off'}`}>
                {m.photo
                  ? <img src={m.photo} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                  : <div className="img-ph mi-ph" />}
                <div className="mi-info">
                  <strong>{m.name}</strong>
                  <span className="muted small">{m.category} · ₹{m.price}</span>
                </div>
                <div className="mi-actions">
                  <label className="switch" title={m.available ? 'Available' : 'Unavailable'}>
                    <input type="checkbox" checked={m.available}
                           onChange={() => updateMenuItem(m.id, { available: !m.available })} />
                    <span />
                  </label>
                  <button onClick={() => setEditing(m.id)}>Edit</button>
                  <button className="danger" onClick={() => remove(m)}>Delete</button>
                </div>
              </article>
            )
        ))}
      </div>
    </div>
  );
}

function CategoryOptionsEditor() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [drafts, setDrafts] = useState({});
  useEffect(() => onChange(() => setTick((t) => t + 1)), []);

  const add = (cat) => {
    const val = (drafts[cat] || '').trim();
    const list = getCategoryOptions(cat);
    if (!val || list.some((o) => o.toLowerCase() === val.toLowerCase())) return;
    setCategoryOptions(cat, [...list, val]);
    setDrafts((d) => ({ ...d, [cat]: '' }));
  };
  const remove = (cat, o) => {
    setCategoryOptions(cat, getCategoryOptions(cat).filter((x) => x !== o));
  };

  return (
    <section className={`card copt ${open ? 'open' : ''}`} data-tick={tick}>
      <button type="button" className="copt-head" onClick={() => setOpen(!open)}>
        <span>Quick customisations <span className="muted small">· what customers can pick per category</span></span>
        <FaChevronDown />
      </button>
      {open && CATEGORIES.map((cat) => (
        <div key={cat} className="copt-row">
          <span className="field-label">{cat}</span>
          <div className="opt-chips">
            {getCategoryOptions(cat).map((o) => (
              <span key={o} className="opt-chip copt-chip">
                {o}
                <button type="button" aria-label={`Remove ${o}`} onClick={() => remove(cat, o)}>
                  <FaXmark />
                </button>
              </span>
            ))}
          </div>
          <div className="copt-add">
            <input value={drafts[cat] || ''} placeholder="Add an option"
                   onChange={(e) => setDrafts((d) => ({ ...d, [cat]: e.target.value }))}
                   onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(cat); } }} />
            <button type="button" onClick={() => add(cat)}>Add</button>
          </div>
        </div>
      ))}
    </section>
  );
}

function ItemForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const valid = f.name.trim() && Number(f.price) > 0;

  return (
    <form className="card mi-form" onSubmit={(e) => { e.preventDefault(); if (valid) onSave(f); }}>
      <div className="row2">
        <label>Name<input value={f.name} onChange={set('name')} /></label>
        <label>Price (₹)<input inputMode="numeric" value={f.price} onChange={set('price')} /></label>
      </div>
      <label>Description<textarea rows={2} value={f.description} onChange={set('description')} /></label>
      <label>Category
        <select value={f.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <div className="field">
        <span className="field-label">Photo</span>
        <ImageDrop value={f.photo} onChange={(photo) => setF((x) => ({ ...x, photo }))} />
      </div>
      <label className="check">
        <input type="checkbox" checked={f.available}
               onChange={(e) => setF((s) => ({ ...s, available: e.target.checked }))} />
        <span>Available</span>
      </label>
      <div className="form-actions">
        <button type="submit" className="primary" disabled={!valid}>Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
