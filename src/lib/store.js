// localStorage-backed data layer for the demo.
// Tables mirror the real schema (customers, menu_items, orders, order_items),
// including nullable future columns (payment_method, paid, paid_at, rider_id),
// so this module can be swapped for API calls without touching the UI.
import { SEED_MENU } from '../data/seed.js';

const KEY = 'kk_db_v5';

function blankDb() {
  return {
    customers: [], menu_items: [], orders: [], order_items: [],
    settings: { category_options: DEFAULT_CATEGORY_OPTIONS }, seq: 1,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw);
      if (!db.settings) db.settings = {};
      if (!db.settings.category_options) db.settings.category_options = DEFAULT_CATEGORY_OPTIONS;
      return db;
    }
  } catch { /* fall through to fresh db */ }
  const db = blankDb();
  seedMenu(db);
  save(db);
  return db;
}

function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
  // Nudge listeners in this tab too (the storage event only fires in other tabs).
  window.dispatchEvent(new Event('kk-db-changed'));
}

function seedMenu(db) {
  const now = new Date().toISOString();
  SEED_MENU.forEach((m) => {
    db.menu_items.push({ id: db.seq++, ...m, available: true, created_at: now });
  });
}

function nextId(db) { return db.seq++; }

// ---- change subscription (storage event covers other tabs) ----
export function onChange(fn) {
  const handler = () => fn();
  window.addEventListener('storage', handler);
  window.addEventListener('kk-db-changed', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('kk-db-changed', handler);
  };
}

// ---- menu ----
export function listMenu({ availableOnly = false } = {}) {
  const db = load();
  const items = db.menu_items.slice().sort((a, b) => a.id - b.id);
  return availableOnly ? items.filter((m) => m.available) : items;
}

export function createMenuItem({ name, description, price, photo, category, available }) {
  const db = load();
  const item = {
    id: nextId(db), name, description, price: Number(price), photo,
    category: category || 'North Indian',
    available: available !== false, created_at: new Date().toISOString(),
  };
  db.menu_items.push(item);
  save(db);
  return item;
}

export function updateMenuItem(id, patch) {
  const db = load();
  const item = db.menu_items.find((m) => m.id === id);
  if (!item) return null;
  Object.assign(item, patch, patch.price !== undefined ? { price: Number(patch.price) } : {});
  save(db);
  return item;
}

export function deleteMenuItem(id) {
  const db = load();
  db.menu_items = db.menu_items.filter((m) => m.id !== id);
  save(db);
}

// ---- customers ----
export function findCustomerByPhone(phone) {
  const db = load();
  return db.customers.find((c) => c.phone === phone) || null;
}

function upsertCustomer(db, c) {
  let existing = db.customers.find((x) => x.phone === c.phone);
  if (existing) {
    Object.assign(existing, c);
    return existing;
  }
  const customer = { id: nextId(db), ...c, created_at: new Date().toISOString() };
  db.customers.push(customer);
  return customer;
}

// ---- orders ----
export function createOrder({ customer, items, jain, freeFromNote, fulfilment, slot }) {
  // customer: {first_name,last_name,phone,customer_type,tower,wing,apartment,full_address}
  // items: [{ menu_item_id, quantity, note }]
  const db = load();
  const cust = upsertCustomer(db, { ...customer, jain_default: !!jain });
  let total = 0;
  const orderId = nextId(db);
  items.forEach(({ menu_item_id, quantity, note }) => {
    const m = db.menu_items.find((x) => x.id === menu_item_id);
    if (!m || quantity < 1) return;
    db.order_items.push({
      id: nextId(db), order_id: orderId, menu_item_id,
      quantity, unit_price: m.price, note: (note || '').trim() || null,
    });
    total += m.price * quantity;
  });
  const now = new Date().toISOString();
  const order = {
    id: orderId, customer_id: cust.id, status: 'open',
    jain: !!jain, free_from_note: (freeFromNote || '').trim(),
    total, created_at: now, status_log: { open: now }, reject_reason: null,
    fulfilment: fulfilment === 'pickup' ? 'pickup' : 'delivery',
    slot: slot || 'ASAP',
    // future columns, nullable from day one
    payment_method: null, paid: null, paid_at: null, rider_id: null,
  };
  db.orders.push(order);
  save(db);
  return order;
}

export function listOrders(status) {
  const db = load();
  // work queues run oldest-first so the chef cooks in order; history stays newest-first
  const fifo = status === 'accepted' || status === 'ready';
  return db.orders
    .filter((o) => !status || o.status === status)
    .sort((a, b) => (fifo ? 1 : -1) * (new Date(a.created_at) - new Date(b.created_at)))
    .map((o) => hydrate(db, o));
}

export function orderCounts() {
  const db = load();
  const counts = { open: 0, accepted: 0, ready: 0, completed: 0, rejected: 0 };
  db.orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
  return counts;
}

export function setOrderStatus(id, status, { reason } = {}) {
  const db = load();
  const o = db.orders.find((x) => x.id === id);
  if (!o) return null;
  o.status = status;
  o.status_log = { ...(o.status_log || {}), [status]: new Date().toISOString() };
  if (status === 'rejected') o.reject_reason = (reason || '').trim() || null;
  save(db);
  return o;
}

// ---- kitchen settings ----
export function getCategoryOptions(category) {
  const opts = load().settings.category_options || {};
  return opts[category] || [];
}

export function setCategoryOptions(category, options) {
  const db = load();
  db.settings.category_options = { ...(db.settings.category_options || {}), [category]: options };
  save(db);
}

function hydrate(db, order) {
  const customer = db.customers.find((c) => c.id === order.customer_id) || {};
  const items = db.order_items
    .filter((oi) => oi.order_id === order.id)
    .map((oi) => ({
      ...oi,
      name: (db.menu_items.find((m) => m.id === oi.menu_item_id) || {}).name || 'Removed item',
    }));
  return { ...order, customer, items };
}

export function formatAddress(c) {
  if (c.customer_type === 'lodha') {
    return `Lodha Park, ${c.tower}, ${c.wing} wing, Apt ${c.apartment}`;
  }
  return c.full_address || '';
}

export const TOWERS = ['Park Side', 'Allura', 'Marquees', 'Trump Tower', 'Kiara', 'Adrina'];
export const SLOT_DEFS = [
  { label: 'ASAP', end: null },          // always available
  { label: 'Lunch (12-2 pm)', end: 14 }, // disabled once its window has passed
  { label: 'Evening (5-7 pm)', end: 19 },
  { label: 'Dinner (7-9 pm)', end: 21 },
];
export const SLOTS = SLOT_DEFS.map((s) => s.label);

export function isSlotPast(label, now = new Date()) {
  const def = SLOT_DEFS.find((s) => s.label === label);
  if (!def || def.end == null) return false;
  return now.getHours() + now.getMinutes() / 60 >= def.end;
}

export const DEFAULT_CATEGORY_OPTIONS = {
  'North Indian': ['Less spicy', 'Extra spicy', 'No onion', 'No garlic', 'Less oil', 'No coriander'],
  'Gujarati': ['Less spicy', 'Less sweet', 'No onion', 'No garlic', 'Less oil'],
  'Japanese': ['No wasabi', 'Less salt', 'Extra soy', 'No spring onion'],
  'Italian': ['Extra cheese', 'No chilli flakes', 'No garlic', 'No olives'],
  'Dessert': ['Less sugar', 'Sugar free', 'No nuts', 'Extra nuts'],
};
