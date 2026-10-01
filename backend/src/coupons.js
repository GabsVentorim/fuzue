// Discount coupons. Always evaluated on the server — the browser only shows the result.
import db from './db.js';
import { round2, cleanCpf } from './util.js';

db.exec(`
CREATE TABLE IF NOT EXISTS coupons (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  code              TEXT NOT NULL UNIQUE COLLATE NOCASE,
  type              TEXT NOT NULL CHECK (type IN ('percent', 'fixed', 'frete')),
  value             REAL NOT NULL DEFAULT 0,
  min_subtotal      REAL NOT NULL DEFAULT 0,
  max_uses          INTEGER,
  uses              INTEGER NOT NULL DEFAULT 0,
  once_per_customer INTEGER NOT NULL DEFAULT 0,
  expires_at        TEXT,
  active            INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

export const TYPES = ['percent', 'fixed', 'frete'];
export const normalizeCode = (code) => String(code || '').trim().toUpperCase().replace(/\s+/g, '');

const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const toCoupon = (r) =>
  r && {
    id: r.id,
    code: r.code,
    type: r.type,
    value: r.value,
    minSubtotal: r.min_subtotal,
    maxUses: r.max_uses,
    uses: r.uses,
    oncePerCustomer: !!r.once_per_customer,
    expiresAt: r.expires_at,
    active: !!r.active,
    createdAt: r.created_at,
    label: describe(r),
  };

export function describe(r) {
  if (r.type === 'percent') return `${r.value}% de desconto nos produtos`;
  if (r.type === 'fixed') return `${brl(r.value)} de desconto`;
  return 'Frete grátis';
}

// Returns { coupon, discount, freeShipping, label } or { error }.
// `discount` applies to the products; free shipping is handled by the caller.
export function evaluateCoupon(codeInput, subtotal, { cpf } = {}) {
  const code = normalizeCode(codeInput);
  if (!code) return { error: 'Digite o código do cupom.' };
  const r = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code);
  if (!r || !r.active) return { error: 'Cupom inválido.' };

  if (r.expires_at) {
    const end = new Date(r.expires_at + 'T23:59:59');
    if (Date.now() > end.getTime()) return { error: 'Esse cupom expirou.' };
  }
  if (r.max_uses != null && r.uses >= r.max_uses) return { error: 'Esse cupom já atingiu o limite de usos.' };
  if (subtotal < r.min_subtotal) return { error: `Esse cupom vale para compras a partir de ${brl(r.min_subtotal)}.` };
  // "1 per customer" is checked by CPF. Without a CPF yet, the order itself re-checks it.
  if (r.once_per_customer && cleanCpf(cpf).length === 11) {
    const used = db
      .prepare("SELECT 1 FROM orders WHERE coupon_code = ? AND json_extract(customer, '$.cpf') = ? AND status != 'cancelado'")
      .get(r.code, cleanCpf(cpf));
    if (used) return { error: 'Esse CPF já usou esse cupom.' };
  }

  let discount = 0;
  if (r.type === 'percent') discount = round2(subtotal * (r.value / 100));
  if (r.type === 'fixed') discount = round2(Math.min(r.value, subtotal));
  return { coupon: toCoupon(r), discount, freeShipping: r.type === 'frete', label: describe(r) };
}

export const countUse = (code, delta) =>
  db.prepare('UPDATE coupons SET uses = MAX(0, uses + ?) WHERE code = ?').run(delta, code);
