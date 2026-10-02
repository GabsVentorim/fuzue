import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import db, { toProduct, toOrder } from '../db.js';
import { CATEGORIES, readBrand, round2, normalize } from '../util.js';
import { mpEnabled, createPayment, syncOrder, PaymentInputError } from '../mercadopago.js';

const router = Router();

router.get('/store', (_req, res) => res.json(readBrand()));

router.get('/categories', (_req, res) => res.json(CATEGORIES));

router.get('/products', (req, res) => {
  const { category, search, featured, sort } = req.query;
  let products = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY id').all().map(toProduct);

  if (category) products = products.filter((p) => p.category === category);
  if (featured === 'true') products = products.filter((p) => p.featured);
  if (search) {
    const q = normalize(search);
    products = products.filter(
      (p) => normalize(p.name).includes(q) || normalize(p.description).includes(q)
    );
  }
  if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
  if (sort === 'name') products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  res.json(products);
});

router.get('/products/:slug', (req, res) => {
  const product = toProduct(db.prepare('SELECT * FROM products WHERE slug = ? AND active = 1').get(req.params.slug));
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

// Validates and prices the order on the server (never trust client prices),
// then saves it and decrements stock in a single transaction.
const placeOrder = db.transaction((body, user) => {
  const { items, customer, payment } = body || {};

  const errors = [];
  if (!Array.isArray(items) || items.length === 0) errors.push('O carrinho está vazio.');
  const required = { name: 'nome', email: 'e-mail', phone: 'WhatsApp', cep: 'CEP', address: 'rua', number: 'número', city: 'cidade', state: 'estado' };
  const missing = Object.keys(required).filter((f) => !customer?.[f] || !String(customer[f]).trim());
  if (missing.length) errors.push(`Preencha: ${missing.map((f) => required[f]).join(', ')}.`);
  if (customer?.email && !/^\S+@\S+\.\S+$/.test(customer.email)) errors.push('E-mail inválido.');
  if (!['pix', 'cartao', 'boleto'].includes(payment)) errors.push('Forma de pagamento inválida.');
  if (errors.length) return { status: 400, error: errors.join(' ') };

  const getProduct = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1');
  const lines = [];
  const needed = new Map(); // productId → total qty across lines (same product, different sizes)
  for (const item of items) {
    const product = toProduct(getProduct.get(item.productId));
    const qty = Math.floor(Number(item.qty));
    if (!product) return { status: 400, error: 'Produto não encontrado.' };
    if (!qty || qty < 1) return { status: 400, error: 'Quantidade inválida.' };
    if (product.sizes.length && !product.sizes.includes(item.size))
      return { status: 400, error: `Escolha um tamanho para ${product.name}.` };
    needed.set(product.id, (needed.get(product.id) || 0) + qty);
    if (product.stock < needed.get(product.id))
      return { status: 409, error: `Estoque insuficiente para ${product.name}.` };
    lines.push({
      productId: product.id,
      name: product.name,
      size: item.size || null,
      color: item.color || null,
      qty,
      unitPrice: product.price,
      total: round2(product.price * qty),
    });
  }

  const brand = readBrand();
  const subtotal = round2(lines.reduce((sum, l) => sum + l.total, 0));
  const { fee = 15, freeFrom = 150 } = brand.shipping || {};
  const shipping = subtotal >= freeFrom ? 0 : fee;
  const discount = payment === 'pix' ? round2(subtotal * 0.05) : 0;

  const cleanCustomer = Object.fromEntries(
    ['name', 'email', 'phone', 'cep', 'address', 'number', 'complement', 'city', 'state'].map((k) => [
      k,
      String(customer[k] ?? '').trim(),
    ])
  );

  const order = {
    id: 'PED-' + randomBytes(3).toString('hex').toUpperCase(),
    user_id: user?.id ?? null,
    created_at: new Date().toISOString(),
    status: 'aguardando_pagamento',
    customer: JSON.stringify(cleanCustomer),
    payment,
    items: JSON.stringify(lines),
    subtotal,
    shipping,
    discount,
    total: round2(subtotal + shipping - discount),
  };

  db.prepare(`INSERT INTO orders (id, user_id, created_at, status, customer, payment, items, subtotal, shipping, discount, total)
    VALUES (@id, @user_id, @created_at, @status, @customer, @payment, @items, @subtotal, @shipping, @discount, @total)`).run(order);

  const decrement = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  const move = db.prepare(
    "INSERT INTO stock_movements (product_id, delta, reason, order_id, user_id) VALUES (?, ?, 'venda', ?, ?)"
  );
  for (const [productId, qty] of needed) {
    decrement.run(qty, productId);
    move.run(productId, -qty, order.id, order.user_id);
  }

  return { status: 201, order: toOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id)) };
});

router.post('/orders', (req, res) => {
  try {
    const result = placeOrder(req.body, req.user);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.status(201).json(result.order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pedido.' });
  }
});

// Orders placed while logged in are only visible to their owner (and admins).
const findVisibleOrder = (id, user) => {
  const order = toOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
  const allowed = order && (!order.userId || order.userId === user?.id || user?.role === 'admin');
  return allowed ? order : null;
};

router.get('/orders/:id', (req, res) => {
  const order = findVisibleOrder(req.params.id, req.user);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(order);
});

// ---------- Mercado Pago (Checkout Transparente / Orders API) ----------

// Mercado Pago statuses where the customer still has something to pay (Pix QR code, boleto).
const PENDING = ['action_required', 'processing'];

// Current payment of an order, refreshed from Mercado Pago. The payment page polls this while
// a Pix or boleto is pending — it also keeps local development working without a webhook.
router.get('/orders/:id/payment', async (req, res) => {
  const order = findVisibleOrder(req.params.id, req.user);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  let payment = null;
  if (mpEnabled() && order.mpOrderId) {
    try {
      payment = await syncOrder(order.mpOrderId);
    } catch (err) {
      console.error('Mercado Pago:', err);
    }
  }
  res.json({ order: findVisibleOrder(order.id, req.user), payment });
});

// Pays an order. Body: { card: { token, paymentMethodId, paymentTypeId, installments }, cpf, neighborhood }.
router.post('/orders/:id/pay', async (req, res) => {
  const order = findVisibleOrder(req.params.id, req.user);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  if (!mpEnabled()) return res.status(503).json({ error: 'Pagamento online não está disponível.' });
  if (order.status !== 'aguardando_pagamento') return res.status(409).json({ error: 'Este pedido não está aguardando pagamento.' });
  // A Pix or boleto already issued stays valid: show it again instead of charging twice.
  if (order.mpOrderId && PENDING.includes(order.mpStatus)) {
    return res.status(409).json({ error: 'Já existe um pagamento em andamento para este pedido.' });
  }
  try {
    const payment = await createPayment(order, req.body);
    res.json({ order: findVisibleOrder(order.id, req.user), payment });
  } catch (err) {
    if (err instanceof PaymentInputError) return res.status(400).json({ error: err.message });
    console.error(`Mercado Pago: pagamento do pedido ${order.id} falhou.`, err);
    res.status(502).json({ error: 'Não foi possível processar o pagamento. Confira os dados e tente de novo.' });
  }
});

export default router;
