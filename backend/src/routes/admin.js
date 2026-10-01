import { Router } from 'express';
import db, { toProduct, toOrder, toUser, toPet, toAddress, toTicket } from '../db.js';
import { requireAdmin } from '../auth.js';
import { imageUpload, publicPath, removeUpload } from '../uploads.js';
import { CATEGORIES, ORDER_STATUSES, round2, slugify, normalize, isValidCpf, cleanCpf } from '../util.js';
import { TYPES as COUPON_TYPES, toCoupon, normalizeCode, countUse } from '../coupons.js';
import { allBanners, toBanner } from '../banners.js';

const router = Router();
router.use(requireAdmin);

const PATTERNS = ['dots', 'stripes', 'hearts', 'plain'];
const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();

// ---------- dashboard ----------
router.get('/dashboard', (_req, res) => {
  const revenueSince = db.prepare(
    "SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count FROM orders WHERE status != 'cancelado' AND created_at >= ?"
  );
  const today = revenueSince.get(startOfDay());
  const month = revenueSince.get(startOfMonth());

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  for (const r of db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all()) byStatus[r.status] = r.n;

  const topProducts = db.prepare(`
    SELECT json_extract(j.value, '$.productId') AS productId, json_extract(j.value, '$.name') AS name,
           SUM(json_extract(j.value, '$.qty')) AS qty, SUM(json_extract(j.value, '$.total')) AS revenue
    FROM orders, json_each(orders.items) AS j
    WHERE orders.status != 'cancelado' AND orders.created_at >= ?
    GROUP BY productId ORDER BY qty DESC LIMIT 5`).all(daysAgo(30));

  const lowStock = db
    .prepare('SELECT * FROM products WHERE active = 1 AND stock <= low_stock_threshold ORDER BY stock')
    .all()
    .map(toProduct);

  const customers = db.prepare(`
    SELECT COUNT(*) AS total, SUM(created_at >= ?) AS recent FROM users WHERE role = 'customer'`).get(daysAgo(30));

  const month2 = String(new Date().getMonth() + 1).padStart(2, '0');
  const birthdays = db.prepare(`
    SELECT p.id, p.name, p.species, p.birth_date AS birthDate, p.birth_date_estimated AS estimated,
           u.id AS ownerId, u.name AS ownerName, u.email AS ownerEmail, u.phone AS ownerPhone
    FROM pets p JOIN users u ON u.id = p.user_id
    WHERE strftime('%m', p.birth_date) = ?
    ORDER BY strftime('%d', p.birth_date)`).all(month2);

  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all().map(toOrder);

  res.json({
    today: { revenue: round2(today.total), orders: today.count },
    month: {
      revenue: round2(month.total),
      orders: month.count,
      avgTicket: month.count ? round2(month.total / month.count) : 0,
    },
    byStatus,
    topProducts: topProducts.map((p) => ({ ...p, revenue: round2(p.revenue) })),
    lowStock,
    customers: { total: customers.total, last30Days: customers.recent || 0 },
    petBirthdays: birthdays.map((b) => ({ ...b, estimated: !!b.estimated })),
    recentOrders,
    openTickets: db.prepare("SELECT COUNT(*) AS n FROM tickets WHERE status = 'aberto'").get().n,
  });
});

// ---------- products ----------
function readProduct(body) {
  const p = {
    name: String(body?.name || '').trim(),
    category: body?.category,
    price: round2(Number(body?.price)),
    description: String(body?.description || '').trim(),
    colors: Array.isArray(body?.colors)
      ? body.colors
          .map((c) => ({
            name: String(c?.name || '').trim(),
            hex: String(c?.hex || '').trim(),
            ...(String(c?.image || '').trim() && { image: String(c.image).trim() }), // optional photo for this colour
          }))
          .filter((c) => c.name && c.hex)
      : [],
    sizes: Array.isArray(body?.sizes) ? [...new Set(body.sizes.map((s) => String(s).trim()).filter(Boolean))] : [],
    pattern: body?.pattern || 'plain',
    badge: String(body?.badge || '').trim() || null,
    featured: body?.featured ? 1 : 0,
    active: body?.active === false ? 0 : 1,
    image: String(body?.image || '').trim() || null,
    low_stock_threshold: Math.max(0, Math.floor(Number(body?.lowStockThreshold ?? 5)) || 0),
  };

  const errors = [];
  if (!p.name) errors.push('Informe o nome.');
  if (!CATEGORIES.some((c) => c.slug === p.category)) errors.push('Categoria inválida.');
  if (!(p.price > 0)) errors.push('Preço inválido.');
  if (!p.colors.length) errors.push('Cadastre pelo menos uma cor.');
  if (p.colors.some((c) => !/^#[0-9a-f]{6}$/i.test(c.hex))) errors.push('Cor em formato inválido (use #RRGGBB).');
  if (!PATTERNS.includes(p.pattern)) errors.push('Estampa inválida.');
  return { p, error: errors.join(' ') || null };
}

const uniqueSlug = (name, exceptId = 0) => {
  const base = slugify(name) || 'produto';
  const taken = db.prepare('SELECT 1 FROM products WHERE slug = ? AND id != ?');
  let slug = base;
  for (let i = 2; taken.get(slug, exceptId); i++) slug = `${base}-${i}`;
  return slug;
};

const getProduct = (id) => toProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
const serialize = (p) => ({ ...p, colors: JSON.stringify(p.colors), sizes: JSON.stringify(p.sizes) });

router.get('/products', (req, res) => {
  let products = db.prepare('SELECT * FROM products ORDER BY active DESC, name').all().map(toProduct);
  if (req.query.q) {
    const q = normalize(req.query.q);
    products = products.filter((p) => normalize(p.name).includes(q) || p.slug.includes(q));
  }
  res.json(products);
});

router.get('/products/:id', (req, res) => {
  const product = getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  res.json(product);
});

router.post('/products', (req, res) => {
  const { p, error } = readProduct(req.body);
  if (error) return res.status(400).json({ error });
  const stock = Math.max(0, Math.floor(Number(req.body?.stock) || 0));

  const id = db.transaction(() => {
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO products (slug, name, category, price, description, colors, sizes, pattern, badge, featured,
        stock, low_stock_threshold, image, active)
      VALUES (@slug, @name, @category, @price, @description, @colors, @sizes, @pattern, @badge, @featured,
        @stock, @low_stock_threshold, @image, @active)`).run({ ...serialize(p), slug: uniqueSlug(p.name), stock });
    if (stock)
      db.prepare(
        "INSERT INTO stock_movements (product_id, delta, reason, note, user_id) VALUES (?, ?, 'entrada', 'Estoque inicial', ?)"
      ).run(lastInsertRowid, stock, req.user.id);
    return lastInsertRowid;
  })();

  res.status(201).json(getProduct(id));
});

// Stock is not edited here — use POST /products/:id/stock so every change is logged.
router.put('/products/:id', (req, res) => {
  const current = getProduct(req.params.id);
  if (!current) return res.status(404).json({ error: 'Produto não encontrado.' });
  const { p, error } = readProduct(req.body);
  if (error) return res.status(400).json({ error });
  const slug = current.name === p.name ? current.slug : uniqueSlug(p.name, current.id);

  db.prepare(`
    UPDATE products SET slug=@slug, name=@name, category=@category, price=@price, description=@description,
      colors=@colors, sizes=@sizes, pattern=@pattern, badge=@badge, featured=@featured,
      low_stock_threshold=@low_stock_threshold, image=@image, active=@active
    WHERE id=@id`).run({ ...serialize(p), slug, id: current.id });
  res.json(getProduct(current.id));
});

router.delete('/products/:id', (req, res) => {
  const product = getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  const sold = db.prepare("SELECT 1 FROM stock_movements WHERE product_id = ? AND reason = 'venda'").get(product.id);
  if (sold)
    return res.status(409).json({ error: 'Esse produto já tem vendas. Desative-o em vez de excluir.' });
  db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
  res.json({ ok: true });
});

router.post('/products/:id/stock', (req, res) => {
  const product = getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  const delta = Math.trunc(Number(req.body?.delta));
  const reason = req.body?.reason === 'entrada' ? 'entrada' : 'ajuste';
  const note = String(req.body?.note || '').trim().slice(0, 200) || null;

  if (!delta) return res.status(400).json({ error: 'Informe a quantidade.' });
  if (reason === 'entrada' && delta < 0) return res.status(400).json({ error: 'Entrada precisa ser positiva.' });
  if (product.stock + delta < 0) return res.status(400).json({ error: 'O estoque não pode ficar negativo.' });

  db.transaction(() => {
    db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(delta, product.id);
    db.prepare('INSERT INTO stock_movements (product_id, delta, reason, note, user_id) VALUES (?, ?, ?, ?, ?)')
      .run(product.id, delta, reason, note, req.user.id);
  })();
  res.json(getProduct(product.id));
});

router.get('/stock-movements', (req, res) => {
  const productId = Number(req.query.productId) || null;
  const rows = db.prepare(`
    SELECT m.id, m.product_id AS productId, p.name AS productName, m.delta, m.reason, m.note,
           m.order_id AS orderId, u.name AS userName, m.created_at AS createdAt
    FROM stock_movements m
    JOIN products p ON p.id = m.product_id
    LEFT JOIN users u ON u.id = m.user_id
    WHERE (? IS NULL OR m.product_id = ?)
    ORDER BY m.created_at DESC, m.id DESC LIMIT 200`).all(productId, productId);
  res.json(rows);
});

const upload = imageUpload('products');
router.post('/uploads', (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    res.status(201).json({ url: publicPath('products', req.file) });
  });
});

// ---------- orders ----------
router.get('/orders', (req, res) => {
  const { status, q, from, to } = req.query;
  let orders = db.prepare(`
    SELECT * FROM orders
    WHERE (? IS NULL OR status = ?) AND (? IS NULL OR created_at >= ?) AND (? IS NULL OR created_at < ?)
    ORDER BY created_at DESC`)
    .all(status || null, status || null, from || null, from || null, to || null, to || null)
    .map(toOrder);
  if (q) {
    const needle = normalize(q);
    orders = orders.filter(
      (o) => normalize(o.id).includes(needle) || normalize(o.customer.name).includes(needle) ||
        normalize(o.customer.email).includes(needle)
    );
  }
  res.json(orders);
});

router.patch('/orders/:id', (req, res) => {
  const order = toOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
  const status = req.body?.status;
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido.' });
  if (order.status === 'cancelado' && status !== 'cancelado')
    return res.status(409).json({ error: 'Pedido cancelado não pode ser reaberto.' });

  db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, order.id);
    if (status === 'cancelado' && order.status !== 'cancelado') {
      if (order.couponCode) countUse(order.couponCode, -1); // give the coupon use back
      // give the items back to stock
      const restock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      const move = db.prepare(
        "INSERT INTO stock_movements (product_id, delta, reason, order_id, user_id) VALUES (?, ?, 'cancelamento', ?, ?)"
      );
      for (const line of order.items) {
        if (restock.run(line.qty, line.productId).changes) move.run(line.productId, line.qty, order.id, req.user.id);
      }
    }
  })();
  res.json(toOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id)));
});

// ---------- home carousel banners ----------
const bannerUpload = imageUpload('banners');
router.post('/banners/upload', (req, res) => {
  bannerUpload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    res.status(201).json({ url: publicPath('banners', req.file) });
  });
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function readBanner(body) {
  const txt = (v, max) => String(v ?? '').trim().slice(0, max) || null;
  const b = {
    title: txt(body?.title, 80),
    subtitle: txt(body?.subtitle, 160),
    image: txt(body?.image, 300),
    image_mobile: txt(body?.imageMobile, 300),
    link_url: txt(body?.linkUrl, 300),
    button_label: txt(body?.buttonLabel, 30),
    active: body?.active === false ? 0 : 1,
    starts_at: body?.startsAt || null,
    ends_at: body?.endsAt || null,
  };
  const errors = [];
  if (!b.image) errors.push('Envie a imagem do banner.');
  if (b.link_url && !/^(\/|https?:\/\/)/.test(b.link_url)) errors.push('O link deve começar com / (página do site) ou https://');
  if ((b.starts_at && !DATE_RE.test(b.starts_at)) || (b.ends_at && !DATE_RE.test(b.ends_at))) errors.push('Data inválida.');
  if (b.starts_at && b.ends_at && b.ends_at < b.starts_at) errors.push('A data final é antes da inicial.');
  return { b, error: errors.join(' ') || null };
}
const getBanner = (id) => toBanner(db.prepare('SELECT * FROM banners WHERE id = ?').get(id));

router.get('/banners', (_req, res) => res.json(allBanners()));

router.post('/banners', (req, res) => {
  const { b, error } = readBanner(req.body);
  if (error) return res.status(400).json({ error });
  const position = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM banners').get().p;
  const { lastInsertRowid } = db.prepare(`INSERT INTO banners (title, subtitle, image, image_mobile, link_url, button_label, active, starts_at, ends_at, position)
    VALUES (@title, @subtitle, @image, @image_mobile, @link_url, @button_label, @active, @starts_at, @ends_at, @position)`).run({ ...b, position });
  res.status(201).json(getBanner(lastInsertRowid));
});

router.put('/banners/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Banner não encontrado.' });
  const { b, error } = readBanner(req.body);
  if (error) return res.status(400).json({ error });
  db.prepare(`UPDATE banners SET title=@title, subtitle=@subtitle, image=@image, image_mobile=@image_mobile, link_url=@link_url,
    button_label=@button_label, active=@active, starts_at=@starts_at, ends_at=@ends_at WHERE id=@id`).run({ ...b, id: current.id });
  // clean up replaced uploads
  if (current.image !== b.image) removeUpload(current.image);
  if (current.image_mobile && current.image_mobile !== b.image_mobile) removeUpload(current.image_mobile);
  res.json(getBanner(current.id));
});

// body: { ids: [3, 1, 2] } — the new order
router.put('/banners-order', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number) : [];
  const set = db.prepare('UPDATE banners SET position = ? WHERE id = ?');
  db.transaction(() => ids.forEach((id, i) => set.run(i, id)))();
  res.json(allBanners());
});

router.delete('/banners/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Banner não encontrado.' });
  db.prepare('DELETE FROM banners WHERE id = ?').run(current.id);
  removeUpload(current.image);
  removeUpload(current.image_mobile);
  res.json({ ok: true });
});

// ---------- coupons ----------
function readCoupon(body) {
  const c = {
    code: normalizeCode(body?.code),
    type: body?.type,
    value: round2(Number(String(body?.value ?? 0).replace(',', '.')) || 0),
    min_subtotal: round2(Number(String(body?.minSubtotal ?? 0).replace(',', '.')) || 0),
    max_uses: body?.maxUses === '' || body?.maxUses == null ? null : Math.max(0, Math.floor(Number(body.maxUses))),
    once_per_customer: body?.oncePerCustomer ? 1 : 0,
    expires_at: body?.expiresAt || null,
    active: body?.active === false ? 0 : 1,
  };
  const errors = [];
  if (!/^[A-Z0-9_-]{3,30}$/.test(c.code)) errors.push('Código: 3 a 30 letras/números, sem espaço.');
  if (!COUPON_TYPES.includes(c.type)) errors.push('Tipo inválido.');
  if (c.type === 'percent' && !(c.value > 0 && c.value <= 100)) errors.push('Porcentagem entre 1 e 100.');
  if (c.type === 'fixed' && !(c.value > 0)) errors.push('Informe o valor do desconto.');
  if (c.type === 'frete') c.value = 0;
  if (c.expires_at && !/^\d{4}-\d{2}-\d{2}$/.test(c.expires_at)) errors.push('Data de validade inválida.');
  return { c, error: errors.join(' ') || null };
}

router.get('/coupons', (_req, res) => {
  res.json(db.prepare('SELECT * FROM coupons ORDER BY active DESC, created_at DESC').all().map(toCoupon));
});

router.post('/coupons', (req, res) => {
  const { c, error } = readCoupon(req.body);
  if (error) return res.status(400).json({ error });
  if (db.prepare('SELECT 1 FROM coupons WHERE code = ?').get(c.code)) return res.status(409).json({ error: 'Já existe um cupom com esse código.' });
  const { lastInsertRowid } = db.prepare(`INSERT INTO coupons (code, type, value, min_subtotal, max_uses, once_per_customer, expires_at, active)
    VALUES (@code, @type, @value, @min_subtotal, @max_uses, @once_per_customer, @expires_at, @active)`).run(c);
  res.status(201).json(toCoupon(db.prepare('SELECT * FROM coupons WHERE id = ?').get(lastInsertRowid)));
});

router.put('/coupons/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Cupom não encontrado.' });
  const { c, error } = readCoupon(req.body);
  if (error) return res.status(400).json({ error });
  if (db.prepare('SELECT 1 FROM coupons WHERE code = ? AND id != ?').get(c.code, current.id))
    return res.status(409).json({ error: 'Já existe um cupom com esse código.' });
  db.prepare(`UPDATE coupons SET code=@code, type=@type, value=@value, min_subtotal=@min_subtotal, max_uses=@max_uses,
    once_per_customer=@once_per_customer, expires_at=@expires_at, active=@active WHERE id=@id`).run({ ...c, id: current.id });
  res.json(toCoupon(db.prepare('SELECT * FROM coupons WHERE id = ?').get(current.id)));
});

router.delete('/coupons/:id', (req, res) => {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- support tickets ("chamados") ----------
const ticketWithUser = (r) => r && { ...toTicket(r), user: { id: r.user_id, name: r.user_name, email: r.user_email, cpf: r.user_cpf } };
const TICKET_SQL = `SELECT t.*, u.name AS user_name, u.email AS user_email, u.cpf AS user_cpf
  FROM tickets t JOIN users u ON u.id = t.user_id`;

router.get('/tickets', (req, res) => {
  const status = req.query.status || null;
  const rows = db.prepare(`${TICKET_SQL} WHERE (? IS NULL OR t.status = ?)
    ORDER BY (t.status = 'aberto') DESC, t.created_at DESC`).all(status, status);
  res.json(rows.map(ticketWithUser));
});

router.patch('/tickets/:id', (req, res) => {
  const t = db.prepare(`${TICKET_SQL} WHERE t.id = ?`).get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Chamado não encontrado.' });
  if (t.status !== 'aberto') return res.status(409).json({ error: 'Esse chamado já foi resolvido.' });
  const action = req.body?.action;
  const note = String(req.body?.note || '').trim().slice(0, 500) || null;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Ação inválida.' });

  if (action === 'approve' && t.type === 'cpf_change') {
    const newCpf = cleanCpf(JSON.parse(t.data).newCpf);
    if (!isValidCpf(newCpf)) return res.status(400).json({ error: 'O CPF pedido é inválido.' });
    if (db.prepare('SELECT 1 FROM users WHERE cpf = ? AND id != ?').get(newCpf, t.user_id))
      return res.status(409).json({ error: 'Esse CPF já está cadastrado em outra conta — recuse o chamado.' });
  }

  db.transaction(() => {
    if (action === 'approve' && t.type === 'cpf_change')
      db.prepare('UPDATE users SET cpf = ? WHERE id = ?').run(cleanCpf(JSON.parse(t.data).newCpf), t.user_id);
    db.prepare(`UPDATE tickets SET status = ?, admin_note = ?, resolved_by = ?,
      resolved_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
      .run(action === 'approve' ? 'aprovado' : 'recusado', note, req.user.id, t.id);
  })();
  res.json(ticketWithUser(db.prepare(`${TICKET_SQL} WHERE t.id = ?`).get(t.id)));
});

// ---------- customers ----------
router.get('/customers', (req, res) => {
  let rows = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
      (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelado') AS spent,
      (SELECT COUNT(*) FROM pets p WHERE p.user_id = u.id) AS pet_count
    FROM users u ORDER BY u.created_at DESC`).all();
  if (req.query.q) {
    const q = normalize(req.query.q);
    rows = rows.filter((r) => normalize(r.name).includes(q) || normalize(r.email).includes(q));
  }
  res.json(
    rows.map((r) => ({ ...toUser(r), orderCount: r.order_count, spent: round2(r.spent), petCount: r.pet_count }))
  );
});

router.get('/customers/:id', (req, res) => {
  const user = toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  if (!user) return res.status(404).json({ error: 'Cliente não encontrado.' });
  res.json({
    ...user,
    addresses: db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(user.id).map(toAddress),
    pets: db.prepare('SELECT * FROM pets WHERE user_id = ?').all(user.id).map(toPet),
    orders: db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id).map(toOrder),
  });
});

router.patch('/customers/:id/role', (req, res) => {
  const role = req.body?.role;
  if (!['customer', 'admin'].includes(role)) return res.status(400).json({ error: 'Perfil inválido.' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Você não pode mudar o próprio perfil.' });
  const { changes } = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  if (!changes) return res.status(404).json({ error: 'Cliente não encontrado.' });
  res.json(toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)));
});

export default router;
