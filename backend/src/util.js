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
