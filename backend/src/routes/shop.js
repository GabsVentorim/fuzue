import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import db, { toProduct, toOrder } from '../db.js';
import { CATEGORIES, readBrand, round2, normalize, cleanCpf, isValidCpf } from '../util.js';
import rateLimit from 'express-rate-limit';
import { quoteShipping, shippingEnabled, ShippingError } from '../shipping.js';
import { evaluateCoupon, countUse } from '../coupons.js';
import { liveBanners } from '../banners.js';
import { mpEnabled, createPayment, syncOrder, PaymentInputError } from '../mercadopago.js';

const router = Router();

router.get('/store', (_req, res) => res.json(readBrand()));

router.get('/categories', (_req, res) => res.json(CATEGORIES));

router.get('/banners', (_req, res) => res.json(liveBanners()));

// ---------- shipping ----------
router.get('/shipping/status', (_req, res) => res.json({ enabled: shippingEnabled() }));

const quoteLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Muitas consultas de frete. Espere um minutinho.' } });

// ---------- coupons ----------
const couponLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Muitas tentativas de cupom. Espere um minutinho.' } });

router.post('/coupons/validate', couponLimiter, (req, res) => {
  const getPrice = db.prepare('SELECT price FROM products WHERE id = ? AND active = 1');
  const subtotal = round2(
    (Array.isArray(req.body?.items) ? req.body.items : []).reduce((s, i) => {
      const p = getPrice.get(i.productId);
      return s + (p ? p.price * Math.max(1, Math.floor(Number(i.qty) || 1)) : 0);
    }, 0)
  );
  const r = evaluateCoupon(req.body?.code, subtotal, { cpf: req.user?.cpf || req.body?.cpf });
  if (r.error) return res.status(400).json({ error: r.error });
  res.json({ code: r.coupon.code, label: r.label, discount: r.discount, freeShipping: r.freeShipping });
});

router.post('/shipping/quote', quoteLimiter, async (req, res) => {
  try {
    res.json(await quoteShipping(req.body?.cep, req.body?.items));
  } catch (err) {
    if (err instanceof ShippingError) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Erro ao calcular o frete.' });
  }
});

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
const placeOrder = db.transaction((body, user, shippingChoice) => {
  const { items, customer, payment } = body || {};

  const errors = [];
  if (!Array.isArray(items) || items.length === 0) errors.push('O carrinho está vazio.');
  const required = { name: 'nome', email: 'e-mail', phone: 'WhatsApp', cep: 'CEP', address: 'rua', number: 'número', city: 'cidade', state: 'estado' };
  const missing = Object.keys(required).filter((f) => !customer?.[f] || !String(customer[f]).trim());
  if (missing.length) errors.push(`Preencha: ${missing.map((f) => required[f]).join(', ')}.`);
  if (customer?.email && !/^\S+@\S+\.\S+$/.test(customer.email)) errors.push('E-mail inválido.');
  // Logged-in customers always buy with the CPF on their account (it can only change through a ticket).
  const cpf = user?.cpf || cleanCpf(customer?.cpf);
  if (!isValidCpf(cpf)) errors.push(cpf ? 'CPF inválido.' : 'Informe o CPF.');
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
  // Real quote (SuperFrete) when configured; otherwise the flat fee from brand.config.json.
  let shipping = shippingChoice ? shippingChoice.price : subtotal >= freeFrom ? 0 : fee;

  // Coupon (re-validated here, inside the transaction)
  let coupon = null;
  if (body.couponCode) {
    coupon = evaluateCoupon(body.couponCode, subtotal, { cpf });
    if (coupon.error) return { status: 400, error: coupon.error };
    if (coupon.freeShipping) shipping = 0;
  }
  const couponDiscount = coupon?.discount || 0;
  // Pix 5% applies to the products after the coupon
  const discount = payment === 'pix' ? round2((subtotal - couponDiscount) * 0.05) : 0;

  const cleanCustomer = Object.fromEntries(
    ['name', 'email', 'phone', 'cep', 'address', 'number', 'complement', 'city', 'state'].map((k) => [
      k,
      String(customer[k] ?? '').trim(),
    ])
  );
  cleanCustomer.cpf = cpf;

  // First purchase of an account without CPF: it will be stored on the account (and then locked).
  const saveCpfOnAccount = user && !user.cpf;
  if (saveCpfOnAccount && db.prepare('SELECT 1 FROM users WHERE cpf = ? AND id != ?').get(cpf, user.id))
    return { status: 409, error: 'Esse CPF já está cadastrado em outra conta.' };

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
    shipping_info: shippingChoice
      ? JSON.stringify({ id: shippingChoice.id, name: shippingChoice.name, company: shippingChoice.company, days: shippingChoice.days, free: shippingChoice.free })
      : null,
    coupon_code: coupon?.coupon.code || null,
    coupon_discount: couponDiscount,
    discount,
    total: round2(subtotal - couponDiscount + shipping - discount),
  };

  if (saveCpfOnAccount) db.prepare('UPDATE users SET cpf = ? WHERE id = ?').run(cpf, user.id);
  db.prepare(`INSERT INTO orders (id, user_id, created_at, status, customer, payment, items, subtotal, shipping, shipping_info,
      coupon_code, coupon_discount, discount, total)
    VALUES (@id, @user_id, @created_at, @status, @customer, @payment, @items, @subtotal, @shipping, @shipping_info,
      @coupon_code, @coupon_discount, @discount, @total)`).run(order);
  if (order.coupon_code) countUse(order.coupon_code, 1);

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

router.post('/orders', async (req, res) => {
  try {
    // Re-quote on the server so the shipping price can't be tampered with.
    let shippingChoice = null;
    if (shippingEnabled()) {
      const serviceId = Number(req.body?.shippingService);
      if (!serviceId) return res.status(400).json({ error: 'Escolha uma opção de frete.' });
      const quote = await quoteShipping(req.body?.customer?.cep, req.body?.items);
      shippingChoice = quote.options.find((o) => o.id === serviceId);
      if (!shippingChoice) return res.status(400).json({ error: 'Essa opção de frete não está mais disponível. Escolha outra.' });
    }
    const result = placeOrder(req.body, req.user, shippingChoice);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.status(201).json(result.order);
  } catch (err) {
    if (err instanceof ShippingError) return res.status(err.status).json({ error: err.message });
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
