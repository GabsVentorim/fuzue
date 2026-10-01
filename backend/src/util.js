import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRAND_FILE = path.join(__dirname, '..', '..', 'brand.config.json');

export const CATEGORIES = [
  { slug: 'coleiras', name: 'Coleiras', description: 'Para passear com estilo' },
  { slug: 'bandanas', name: 'Bandanas', description: 'Charme no pescoço' },
  { slug: 'presilhas', name: 'Presilhas', description: 'Lacinhos que não puxam o pelo' },
];

export const ORDER_STATUSES = ['aguardando_pagamento', 'pago', 'enviado', 'entregue', 'cancelado'];

export const readBrand = () => (existsSync(BRAND_FILE) ? JSON.parse(readFileSync(BRAND_FILE, 'utf8')) : {});

export const round2 = (n) => Math.round(n * 100) / 100;

export const normalize = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const slugify = (s) =>
  normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---------- CPF ----------
export const cleanCpf = (v) => String(v || '').replace(/\D/g, '');
export const formatCpf = (v) => cleanCpf(v).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

// Checks the two verification digits (and rejects 000.000.000-00, 111.111.111-11, …).
export function isValidCpf(v) {
  const d = cleanCpf(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digit = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(d[9]) && digit(10) === Number(d[10]);
}
