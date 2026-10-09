import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import db, { toUser } from '../db.js';
import { startSession, endSession, promoteIfAdmin, requireAuth } from '../auth.js';

const router = Router();

// Não há cadastro público: as contas da loja são criadas pelo script
// `npm run create-admin -- email@exemplo.com senha`. Só sobra o login para ser atacado.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Espere alguns minutos e tente de novo.' },
});

const byEmail = db.prepare('SELECT * FROM users WHERE email = ?');

router.post('/login', limiter, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const row = byEmail.get(email);

  // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quem tem conta.
  if (!row || !row.password_hash || !bcrypt.compareSync(password, row.password_hash))
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

  promoteIfAdmin(row);
  startSession(res, row);
  res.json(toUser(row));
});

router.post('/logout', (_req, res) => {
  endSession(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: req.user ? toUser(req.user) : null });
});

router.put('/password', requireAuth, limiter, (req, res) => {
  const current = String(req.body?.currentPassword || '');
  const next = String(req.body?.newPassword || '');

  if (!bcrypt.compareSync(current, req.user.password_hash || ''))
    return res.status(401).json({ error: 'A senha atual está incorreta.' });
  if (next.length < 8) return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 8 caracteres.' });
  if (next === current) return res.status(400).json({ error: 'A nova senha tem que ser diferente da atual.' });

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), req.user.id);
  res.json({ ok: true });
});

export default router;
