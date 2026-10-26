import { useEffect, useState } from 'react';
import {
  listMenu, createMenuItem, updateMenuItem, deleteMenuItem, onChange,
  getCategoryOptions, setCategoryOptions, listCategories,
} from '../../lib/store.js';
import ImageDrop from '../../components/ImageDrop.jsx';
import { FaMagnifyingGlass, FaXmark, FaChevronDown } from 'react-icons/fa6';

const EMPTY = { name: '', description: '', price: '', photo: '', category: '', available: true };

export default function MenuManager() {
  const [menu, setMenu] = useState(listMenu);
  const [editing, setEditing] = useState(null); // null | 'new' | item id
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);

  useEffect(() => onChange(() => setMenu(listMenu())), []);

  const cats = listCategories();
  const needle = q.trim().toLowerCase();
  const shown = menu.filter((m) => {
    if (cat && m.category !== cat) return false;
    if (!needle) return true;
    return m.name.toLowerCase().includes(needle)
      || (m.category || '').toLowerCase().includes(needle)
      || (m.description || '').toLowerCase().includes(needle);
  });

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

      <div className="cat-chips">
        {cats.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'on' : ''}`}
                  onClick={() => setCat(cat === c ? null : c)}>
            {c}{cat === c && <FaXmark />}
          </button>
        ))}
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
      {open && listCategories().map((cat) => (
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
  const cats = listCategories();
  const [f, setF] = useState({ ...EMPTY, category: cats[0] || '', ...initial });
  const [newCat, setNewCat] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const valid = f.name.trim() && Number(f.price) > 0 && f.category.trim();

  return (
    <form className="card mi-form" onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ ...f, category: f.category.trim() }); }}>
      <div className="row2">
        <label>Name<input value={f.name} onChange={set('name')} /></label>
        <label>Price (₹)<input inputMode="numeric" value={f.price} onChange={set('price')} /></label>
      </div>
      <label>Description<textarea rows={2} value={f.description} onChange={set('description')} /></label>
      <label>Category
        <select value={newCat ? '__new' : f.category}
                onChange={(e) => {
                  if (e.target.value === '__new') { setNewCat(true); setF((s) => ({ ...s, category: '' })); }
                  else { setNewCat(false); setF((s) => ({ ...s, category: e.target.value })); }
                }}>
          {cats.map((c) => <option key={c}>{c}</option>)}
          <option value="__new">+ New category...</option>
        </select>
      </label>
      {newCat && (
        <label>New category name
          <input autoFocus value={f.category} onChange={set('category')} placeholder="e.g. Beverages" />
        </label>
      )}
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
