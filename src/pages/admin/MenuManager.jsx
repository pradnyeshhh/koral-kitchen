import { useEffect, useState } from 'react';
import { listMenu, createMenuItem, updateMenuItem, deleteMenuItem, onChange } from '../../lib/store.js';
import { CATEGORIES } from '../../data/seed.js';

const EMPTY = { name: '', description: '', price: '', photo: '', category: CATEGORIES[0], available: true };

export default function MenuManager() {
  const [menu, setMenu] = useState(listMenu);
  const [editing, setEditing] = useState(null); // null | 'new' | item id

  useEffect(() => onChange(() => setMenu(listMenu())), []);

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
        <h1>Menu <span className="muted">· {menu.length} items</span></h1>
        <button className="primary" onClick={() => setEditing('new')}>+ Add item</button>
      </div>

      {editing === 'new' && <ItemForm initial={EMPTY} onSave={save} onCancel={() => setEditing(null)} />}

      <div className="mi-list">
        {menu.map((m) => (
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
      <div className="row2">
        <label>Category
          <select value={f.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Photo URL<input value={f.photo} onChange={set('photo')} placeholder="/images/… or https://…" /></label>
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
