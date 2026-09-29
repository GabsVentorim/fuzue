import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, 'data');
export const DB_DIR = path.join(__dirname, '..', 'data');
export const DB_FILE = process.env.DB_FILE || path.join(DB_DIR, 'fuzue.db');

mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT,
  google_id     TEXT UNIQUE,
  avatar_url    TEXT,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT,
  cep         TEXT NOT NULL,
  address     TEXT NOT NULL,
  number      TEXT NOT NULL,
  complement  TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  is_default  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pets (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  species              TEXT NOT NULL CHECK (species IN ('cachorro', 'gato')),
  sex                  TEXT CHECK (sex IN ('macho', 'femea')),
  birth_date           TEXT,
  birth_date_estimated INTEGER NOT NULL DEFAULT 0,
  breed                TEXT,
  is_mixed             INTEGER NOT NULL DEFAULT 0,
  size                 TEXT CHECK (size IN ('mini', 'pequeno', 'medio', 'grande', 'gigante')),
  weight_kg            REAL,
  neck_cm              REAL,
  coat_color           TEXT,
  neutered             INTEGER NOT NULL DEFAULT 0,
  notes                TEXT,
  photo_url            TEXT,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS products (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  category            TEXT NOT NULL,
  price               REAL NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  colors              TEXT NOT NULL DEFAULT '[]',
  sizes               TEXT NOT NULL DEFAULT '[]',
  pattern             TEXT NOT NULL DEFAULT 'plain',
  badge               TEXT,
  featured            INTEGER NOT NULL DEFAULT 0,
  stock               INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  image               TEXT,
  active              INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  status     TEXT NOT NULL,
  customer   TEXT NOT NULL,
  payment    TEXT NOT NULL,
  items      TEXT NOT NULL,
  subtotal   REAL NOT NULL,
  shipping   REAL NOT NULL,
  discount   REAL NOT NULL,
  total      REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta      INTEGER NOT NULL,
  reason     TEXT NOT NULL CHECK (reason IN ('venda', 'ajuste', 'entrada', 'cancelamento')),
  note       TEXT,
  order_id   TEXT,
  user_id    INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_user ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_moves_product ON stock_movements(product_id);
`);

// ---------- migrations for databases created by older versions ----------
const hasColumn = (table, col) => db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col);
if (!hasColumn('orders', 'shipping_info')) db.exec('ALTER TABLE orders ADD COLUMN shipping_info TEXT');
if (!hasColumn('orders', 'coupon_code')) db.exec('ALTER TABLE orders ADD COLUMN coupon_code TEXT');
if (!hasColumn('orders', 'coupon_discount')) db.exec('ALTER TABLE orders ADD COLUMN coupon_discount REAL NOT NULL DEFAULT 0');

// ---------- first boot: import the old JSON data ----------
const readSeed = (file) => {
  const p = path.join(SEED_DIR, file);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
};

const insertProduct = db.prepare(`
  INSERT INTO products (id, slug, name, category, price, description, colors, sizes, pattern, badge, featured, stock, image)
  VALUES (@id, @slug, @name, @category, @price, @description, @colors, @sizes, @pattern, @badge, @featured, @stock, @image)
`);

export function seedProducts(products) {
  db.transaction(() => {
    for (const p of products) {
      insertProduct.run({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description || '',
        colors: JSON.stringify(p.colors || []),
        sizes: JSON.stringify(p.sizes || []),
        pattern: p.pattern || 'plain',
        badge: p.badge || null,
        featured: p.featured ? 1 : 0,
        stock: p.stock ?? 0,
        image: p.image || null,
      });
    }
  })();
}

if (db.prepare('SELECT COUNT(*) AS n FROM products').get().n === 0) {
  const products = readSeed('products.json') || readSeed('products.seed.json') || [];
  seedProducts(products);

  const orders = readSeed('orders.json') || [];
  const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO orders (id, created_at, status, customer, payment, items, subtotal, shipping, discount, total)
    VALUES (@id, @createdAt, @status, @customer, @payment, @items, @subtotal, @shipping, @discount, @total)
  `);
  db.transaction(() => {
    for (const o of orders)
      insertOrder.run({ ...o, customer: JSON.stringify(o.customer), items: JSON.stringify(o.items) });
  })();
  if (products.length) console.log(`📦 Banco criado com ${products.length} produtos e ${orders.length} pedidos.`);
}

// ---------- row mappers ----------
export const toProduct = (r) =>
  r && {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    price: r.price,
    description: r.description,
    colors: JSON.parse(r.colors),
    sizes: JSON.parse(r.sizes),
    pattern: r.pattern,
    badge: r.badge || undefined,
    featured: !!r.featured,
    stock: r.stock,
    lowStockThreshold: r.low_stock_threshold,
    image: r.image || undefined,
    active: !!r.active,
    createdAt: r.created_at,
  };

export const toOrder = (r) =>
  r && {
    id: r.id,
    userId: r.user_id,
    createdAt: r.created_at,
    status: r.status,
    customer: JSON.parse(r.customer),
    payment: r.payment,
    items: JSON.parse(r.items),
    subtotal: r.subtotal,
    shipping: r.shipping,
    shippingInfo: r.shipping_info ? JSON.parse(r.shipping_info) : null,
    couponCode: r.coupon_code || null,
    couponDiscount: r.coupon_discount || 0,
    discount: r.discount,
    total: r.total,
  };

export const toUser = (r) =>
  r && {
    id: r.id,
    email: r.email,
    name: r.name,
    phone: r.phone || '',
    avatarUrl: r.avatar_url || null,
    role: r.role,
    hasPassword: !!r.password_hash,
    hasGoogle: !!r.google_id,
    createdAt: r.created_at,
  };

export const toAddress = (r) =>
  r && {
    id: r.id,
    label: r.label || '',
    cep: r.cep,
    address: r.address,
    number: r.number,
    complement: r.complement || '',
    city: r.city,
    state: r.state,
    isDefault: !!r.is_default,
  };

export const toPet = (r) =>
  r && {
    id: r.id,
    name: r.name,
    species: r.species,
    sex: r.sex,
    birthDate: r.birth_date,
    birthDateEstimated: !!r.birth_date_estimated,
    breed: r.breed || '',
    isMixed: !!r.is_mixed,
    size: r.size,
    weightKg: r.weight_kg,
    neckCm: r.neck_cm,
    coatColor: r.coat_color || '',
    neutered: !!r.neutered,
    notes: r.notes || '',
    photoUrl: r.photo_url || null,
    createdAt: r.created_at,
  };

export default db;
