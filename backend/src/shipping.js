// Shipping quotes via SuperFrete (https://superfrete.readme.io).
// The token stays on the server — the site only talks to /api/shipping/quote.
import db, { toProduct } from './db.js';
import { readBrand, round2 } from './util.js';

const API_URL = process.env.SUPERFRETE_URL || 'https://api.superfrete.com/api/v0/calculator';
const SERVICES = '1,2,17,3,31,33'; // PAC, SEDEX, Mini Envios, Jadlog, Loggi, J&T
const CACHE_MS = 15 * 60 * 1000;

// Default box for one item when the product has no measurements of its own (cm / kg).
const DEFAULT_PACKAGE = { weight: 0.1, height: 2, width: 11, length: 16 };

export const cleanCep = (cep) => String(cep || '').replace(/\D/g, '');
export const shippingEnabled = () => !!(process.env.SUPERFRETE_TOKEN && cleanCep(process.env.STORE_CEP).length === 8);

export class ShippingError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

const cache = new Map();

async function callSuperFrete(toCep, products) {
  const key = toCep + JSON.stringify(products);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(12000),
      headers: {
        Authorization: `Bearer ${process.env.SUPERFRETE_TOKEN}`,
        'User-Agent': `${readBrand().name || 'Loja'} Petstore/1.0 (${process.env.SUPERFRETE_CONTACT || readBrand().email || ''})`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        from: { postal_code: cleanCep(process.env.STORE_CEP) },
        to: { postal_code: toCep },
        services: SERVICES,
        options: { own_hand: false, receipt: false, insurance_value: 0, use_insurance_value: false },
        products,
      }),
    });
  } catch (err) {
    console.error('SuperFrete indisponível:', err.message);
    throw new ShippingError('Não conseguimos calcular o frete agora. Tente de novo em instantes.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(data)) {
    console.error('SuperFrete erro', res.status, data);
    throw new ShippingError(
      res.status === 401 ? 'Cálculo de frete indisponível (token da SuperFrete inválido).' : 'Não conseguimos calcular o frete para esse CEP.'
    );
  }
  cache.set(key, { at: Date.now(), data });
  return data;
}

// items: [{ productId, qty }] → { options: [...], subtotal, freeShipping }
export async function quoteShipping(cepInput, items) {
  const cep = cleanCep(cepInput);
  if (cep.length !== 8) throw new ShippingError('Digite um CEP válido com 8 números.', 400);
  if (!shippingEnabled()) throw new ShippingError('Cálculo de frete não configurado.', 501);

  const getProduct = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1');
  const lines = [];
  for (const item of Array.isArray(items) ? items : []) {
    const product = toProduct(getProduct.get(item.productId));
    const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
    if (product) lines.push({ product, qty });
  }
  if (!lines.length) throw new ShippingError('Adicione um produto para calcular o frete.', 400);

  const products = lines.map(({ qty }) => ({ quantity: qty, ...DEFAULT_PACKAGE }));
  const raw = await callSuperFrete(cep, products);

  const subtotal = round2(lines.reduce((s, l) => s + l.product.price * l.qty, 0));
  const { freeFrom = 150 } = readBrand().shipping || {};
  const freeShipping = subtotal >= freeFrom;

  const options = raw
    .filter((o) => !o.has_error && !o.error && Number(o.price) > 0)
    .map((o) => ({
      id: o.id,
      name: o.name,
      company: o.company?.name || '',
      logo: o.company?.picture || null,
      price: round2(Number(o.price)),
      originalPrice: round2(Number(o.price)),
      days: { min: o.delivery_range?.min ?? o.delivery_time, max: o.delivery_range?.max ?? o.delivery_time },
      free: false,
    }))
    .sort((a, b) => a.price - b.price);

  if (!options.length) throw new ShippingError('Nenhuma transportadora atende esse CEP no momento.', 422);

  // Free shipping above `freeFrom`: the cheapest option becomes free.
  if (freeShipping) Object.assign(options[0], { price: 0, free: true });

  return { cep, options, subtotal, freeShipping, freeFrom };
}
