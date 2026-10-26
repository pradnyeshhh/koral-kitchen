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

// ---- demo overlay ----
// Sample customers and orders shown alongside real data. They are rebuilt fresh
// on every page load, so playing with their statuses resets on refresh, while
// orders placed through the demo site persist normally.
let demoData = null;

function buildDemoData() {
  const mins = (m) => new Date(Date.now() - m * 60000).toISOString();
  let id = 9000;
  const customers = [
    ['Asha', 'Mehta', '9820012345', 'lodha', 'Kiara', 'B', '1204', null, true],
    ['Rohan', 'Shah', '9833012876', 'lodha', 'Park Side', 'A', '803', null, false],
    ['Meera', 'Jain', '9898121212', 'lodha', 'Trump Tower', 'B', '2104', null, true],
    ['Kunal', 'Desai', '9833344556', 'other', null, null, null, '702, Sea Breeze CHS, Worli Sea Face Rd, Worli, 400018', false],
    ['Priya', 'Nair', '9820788990', 'lodha', 'Allura', 'A', '1502', null, false],
    ['Sameer', 'Kulkarni', '9821567834', 'other', null, null, null, '12, Green Acres, Dr Annie Besant Rd, Worli', false],
    ['Divya', 'Rao', '9930456712', 'lodha', 'Marquees', 'B', '605', null, false],
    ['Nikhil', 'Bhatt', '9867120945', 'lodha', 'Adrina', 'A', '1801', null, false],
  ].map(([first_name, last_name, phone, customer_type, tower, wing, apartment, full_address, jain_default]) => ({
    id: id++, first_name, last_name, phone, customer_type,
    tower, wing, apartment, full_address, jain_default,
    created_at: mins(60 * 72),
  }));
  // [customer index, status, [menu item id, qty, note?][], jain, free-from, minutes ago, fulfilment]
  const sample = [
    [0, 'open', [[1, 1, 'less spicy'], [6, 1], [21, 2]], true, 'no coriander', 12, 'delivery'],
    [3, 'open', [[12, 2], [14, 1]], false, '', 25, 'delivery'],
    [6, 'open', [[10, 2]], false, 'less oil', 40, 'pickup'],
    [1, 'accepted', [[16, 1], [17, 1], [24, 1]], false, '', 75, 'delivery'],
    [2, 'accepted', [[5, 1], [7, 1, 'extra chhundo']], true, '', 95, 'delivery'],
    [4, 'ready', [[4, 2], [22, 2]], false, '', 150, 'delivery'],
    [1, 'rejected', [[20, 1]], false, '', 300, 'delivery'],
    [5, 'completed', [[2, 1], [3, 1]], false, '', 1320, 'delivery'],
    [0, 'completed', [[8, 1], [10, 1]], true, 'no coriander', 1560, 'pickup'],
    [7, 'completed', [[11, 1], [13, 1], [25, 2]], false, '', 1800, 'delivery'],
  ];
  const STAGE_OFFSETS = { open: 0, accepted: 8, ready: 35, completed: 55 };
  const FLOW = ['open', 'accepted', 'ready', 'completed'];
  const orders = [];
  const order_items = [];
  sample.forEach(([ci, status, items, jain, freeFrom, minsAgo, fulfilment]) => {
    const orderId = id++;
    let total = 0;
    items.forEach(([mid, qty, note]) => {
      const m = SEED_MENU[mid - 1];
      order_items.push({
        id: id++, order_id: orderId, menu_item_id: mid,
        quantity: qty, unit_price: m.price, note: note || null,
      });
      total += m.price * qty;
    });
    const status_log = {};
    if (status === 'rejected') {
      status_log.open = mins(minsAgo);
      status_log.rejected = mins(minsAgo - 10);
    } else {
      FLOW.slice(0, FLOW.indexOf(status) + 1).forEach((st) => {
        status_log[st] = mins(minsAgo - STAGE_OFFSETS[st]);
      });
    }
    orders.push({
      id: orderId, customer_id: customers[ci].id, status,
      jain, free_from_note: freeFrom, total, created_at: mins(minsAgo),
      status_log, reject_reason: status === 'rejected' ? 'Kitchen at capacity' : null,
      fulfilment, demo: true,
      payment_method: null, paid: null, paid_at: null, rider_id: null,
    });
  });
  return { customers, orders, order_items };
}

function getDemoData() {
  if (demoData) return demoData;
  try {
    if (localStorage.getItem('kk_demo_off') === '1') {
      demoData = { customers: [], orders: [], order_items: [] };
      return demoData;
    }
  } catch { /* storage unavailable: keep the overlay */ }
  demoData = buildDemoData();
  return demoData;
}
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
  return db.customers.find((c) => c.phone === phone)
    || getDemoData().customers.find((c) => c.phone === phone)
    || null;
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
export function createOrder({ customer, items, jain, freeFromNote, fulfilment }) {
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
  return [...db.orders, ...getDemoData().orders]
    .filter((o) => !status || o.status === status)
    .sort((a, b) => (fifo ? 1 : -1) * (new Date(a.created_at) - new Date(b.created_at)))
    .map((o) => hydrate(db, o));
}

export function orderCounts() {
  const db = load();
  const counts = { open: 0, accepted: 0, ready: 0, completed: 0, rejected: 0 };
  [...db.orders, ...getDemoData().orders].forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
  return counts;
}

export function setOrderStatus(id, status, { reason } = {}) {
  // demo orders change in memory only, so a refresh restores them
  const demoOrder = getDemoData().orders.find((x) => x.id === id);
  if (demoOrder) {
    demoOrder.status = status;
    demoOrder.status_log = { ...(demoOrder.status_log || {}), [status]: new Date().toISOString() };
    if (status === 'rejected') demoOrder.reject_reason = (reason || '').trim() || null;
    window.dispatchEvent(new Event('kk-db-changed'));
    return demoOrder;
  }
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
  const demo = getDemoData();
  const customer = db.customers.find((c) => c.id === order.customer_id)
    || demo.customers.find((c) => c.id === order.customer_id) || {};
  const items = [...db.order_items, ...demo.order_items]
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
export const DEFAULT_CATEGORY_OPTIONS = {
  'North Indian': ['Less spicy', 'Extra spicy', 'No onion', 'No garlic', 'Less oil', 'No coriander'],
  'Gujarati': ['Less spicy', 'Less sweet', 'No onion', 'No garlic', 'Less oil'],
  'Japanese': ['No wasabi', 'Less salt', 'Extra soy', 'No spring onion'],
  'Italian': ['Extra cheese', 'No chilli flakes', 'No garlic', 'No olives'],
  'Dessert': ['Less sugar', 'Sugar free', 'No nuts', 'Extra nuts'],
};
