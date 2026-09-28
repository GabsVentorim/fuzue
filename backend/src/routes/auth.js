import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import db, { toUser } from '../db.js';
import { startSession, endSession, promoteIfAdmin } from '../auth.js';

const router = Router();
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Espere alguns minutos e tente de novo.' },
});

const byEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const byGoogle = db.prepare('SELECT * FROM users WHERE google_id = ?');
const byId = db.prepare('SELECT * FROM users WHERE id = ?');

const signIn = (res, row) => {
  promoteIfAdmin(row);
  startSession(res, row);
  return toUser(row);
};

router.post('/register', limiter, (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!name) return res.status(400).json({ error: 'Informe seu nome.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });
  if (password.length < 8) return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres.' });

  const existing = byEmail.get(email);
  if (existing) {
    const hint = existing.google_id && !existing.password_hash ? ' Use "Entrar com Google".' : '';
    return res.status(409).json({ error: `Já existe uma conta com esse e-mail.${hint}` });
  }

  const hash = bcrypt.hashSync(password, 10);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
    .run(email, name, hash);
  res.status(201).json(signIn(res, byId.get(lastInsertRowid)));
});

router.post('/login', limiter, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const row = byEmail.get(email);

  if (row && !row.password_hash)
    return res.status(400).json({ error: 'Essa conta foi criada com o Google. Use "Entrar com Google".' });
  if (!row || !bcrypt.compareSync(password, row.password_hash))
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

  res.json(signIn(res, row));
});

router.post('/google', limiter, async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(501).json({ error: 'Login com Google não está configurado.' });

  let payload;
  try {
    const ticket = await new OAuth2Client(clientId).verifyIdToken({
      idToken: String(req.body?.credential || ''),
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Não foi possível validar o login com Google.' });
  }
  if (!payload?.email || !payload.email_verified)
    return res.status(401).json({ error: 'Seu e-mail do Google não está verificado.' });

  const email = payload.email.toLowerCase();
  let row = byGoogle.get(payload.sub);

  if (!row) {
    const existing = byEmail.get(email);
    if (existing) {
      // Same verified e-mail → link the Google account to the existing user.
      db.prepare('UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?')
        .run(payload.sub, payload.picture || null, existing.id);
      row = byId.get(existing.id);
    } else {
      const { lastInsertRowid } = db
        .prepare('INSERT INTO users (email, name, google_id, avatar_url) VALUES (?, ?, ?, ?)')
        .run(email, payload.name || email.split('@')[0], payload.sub, payload.picture || null);
      row = byId.get(lastInsertRowid);
    }
  }

  res.json(signIn(res, row));
});

router.post('/logout', (_req, res) => {
  endSession(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: req.user ? toUser(req.user) : null });
});

export default router;
