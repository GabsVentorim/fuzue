import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRAND_FILE = path.join(__dirname, '..', '..', 'brand.config.json');

export const readBrand = () => (existsSync(BRAND_FILE) ? JSON.parse(readFileSync(BRAND_FILE, 'utf8')) : {});

export const SPECIES = ['cachorro', 'gato', 'outro'];
export const SEXES = ['macho', 'femea'];
export const SIZES = ['mini', 'pequeno', 'medio', 'grande', 'gigante'];
export const TAG_STATUSES = ['ativo', 'perdido', 'inativo'];

export const normalize = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const slugify = (s) =>
  normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---------- código da plaquinha ----------
// Sem vogais e sem 0/1/I/O: o código é ditado por telefone e gravado à mão, então
// nada que se confunda na leitura e nada que forme palavra sem querer.
const CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ23456789';

export const normalizeCode = (v) => String(v || '').trim().toUpperCase().replace(/\s+/g, '');

// A validação é mais frouxa que a geração de propósito: medalhas antigas foram gravadas
// com códigos como CR-1001, e elas precisam continuar editáveis. Só os códigos novos
// nascem sem caracteres ambíguos.
export const isValidCode = (v, prefix = 'CR-') => {
  const code = normalizeCode(v);
  const pre = prefix.toUpperCase();
  if (!code.startsWith(pre)) return false;
  const body = code.slice(pre.length);
  return body.length >= 3 && body.length <= 10 && /^[A-Z0-9]+$/.test(body);
};

export function randomCode(prefix = 'CR-', length = 5) {
  let body = '';
  for (let i = 0; i < length; i++) body += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return prefix.toUpperCase() + body;
}

// ---------- telefone ----------
export const cleanPhone = (v) => String(v || '').replace(/\D/g, '');

// Guarda sempre com DDI: um número brasileiro digitado como 27999887766 vira 5527999887766,
// que é o formato que o link do WhatsApp (wa.me) espera.
export const toWhatsapp = (v) => {
  const d = cleanPhone(v);
  if (!d) return '';
  return d.length <= 11 ? '55' + d : d;
};

// Um celular brasileiro tem 10 ou 11 dígitos (DDD + número), 12 ou 13 com o 55 na frente.
export const isValidPhone = (v) => {
  const d = cleanPhone(v);
  return d.length >= 10 && d.length <= 13;
};

export const formatPhone = (v) => {
  const d = cleanPhone(v).replace(/^55/, '');
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return v || '';
};
