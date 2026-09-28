import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db, { toUser, toAddress, toOrder } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

const clean = (v) => String(v ?? '').trim();

// ---------- profile ----------
router.get('/', (req, res) => res.json(toUser(req.user)));

router.put('/', (req, res) => {
  const name = clean(req.body?.name);
  const phone = clean(req.body?.phone);
  if (!name) return res.status(400).json({ error: 'Informe seu nome.' });
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name, phone || null, req.user.id);
  res.json(toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)));
});

router.put('/password', (req, res) => {
  const current = String(req.body?.current || '');
  const next = String(req.body?.password || '');
  if (req.user.password_hash && !bcrypt.compareSync(current, req.user.password_hash))
    return res.status(400).json({ error: 'Senha atual incorreta.' });
  if (next.length < 8) return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 8 caracteres.' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), req.user.id);
  res.json({ ok: true });
});

// ---------- addresses ----------
const ADDRESS_FIELDS = { cep: 'CEP', address: 'rua', number: 'número', city: 'cidade', state: 'estado' };

function readAddress(body) {
  const a = {
    label: clean(body?.label) || null,
    cep: clean(body?.cep),
    address: clean(body?.address),
    number: clean(body?.number),
    complement: clean(body?.complement) || null,
    city: clean(body?.city),
    state: clean(body?.state).toUpperCase().slice(0, 2),
    is_default: body?.isDefault ? 1 : 0,
  };
  const missing = Object.keys(ADDRESS_FIELDS).filter((k) => !a[k]);
  return { a, error: missing.length ? `Preencha: ${missing.map((k) => ADDRESS_FIELDS[k]).join(', ')}.` : null };
}

const listAddresses = (userId) =>
  db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id').all(userId).map(toAddress);

const saveAddress = db.transaction((userId, a, id) => {
  const hasAny = db.prepare('SELECT 1 FROM addresses WHERE user_id = ?').get(userId);
  if (!hasAny) a.is_default = 1; // first address is always the default
  if (a.is_default) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
  if (id) {
    return db.prepare(`UPDATE addresses SET label=@label, cep=@cep, address=@address, number=@number,
      complement=@complement, city=@city, state=@state, is_default=@is_default WHERE id=@id AND user_id=@user_id`)
      .run({ ...a, id, user_id: userId }).changes;
  }
  return db.prepare(`INSERT INTO addresses (user_id, label, cep, address, number, complement, city, state, is_default)
    VALUES (@user_id, @label, @cep, @address, @number, @complement, @city, @state, @is_default)`)
    .run({ ...a, user_id: userId }).changes;
});

router.get('/addresses', (req, res) => res.json(listAddresses(req.user.id)));

router.post('/addresses', (req, res) => {
  const { a, error } = readAddress(req.body);
  if (error) return res.status(400).json({ error });
  saveAddress(req.user.id, a);
  res.status(201).json(listAddresses(req.user.id));
});

router.put('/addresses/:id', (req, res) => {
  const { a, error } = readAddress(req.body);
  if (error) return res.status(400).json({ error });
  if (!saveAddress(req.user.id, a, Number(req.params.id)))
    return res.status(404).json({ error: 'Endereço não encontrado.' });
  res.json(listAddresses(req.user.id));
});

router.delete('/addresses/:id', (req, res) => {
  db.transaction(() => {
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    // keep one default if any remain
    const hasDefault = db.prepare('SELECT 1 FROM addresses WHERE user_id = ? AND is_default = 1').get(req.user.id);
    if (!hasDefault)
      db.prepare('UPDATE addresses SET is_default = 1 WHERE id = (SELECT MIN(id) FROM addresses WHERE user_id = ?)')
        .run(req.user.id);
  })();
  res.json(listAddresses(req.user.id));
});

// ---------- orders ----------
router.get('/orders', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map(toOrder));
});

export default router;
