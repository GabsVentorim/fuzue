import jwt from 'jsonwebtoken';
import db, { toUser } from './db.js';

const COOKIE = 'fuzue_session';
const MAX_AGE_DAYS = 30;

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troque-em-producao';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('Defina JWT_SECRET no .env antes de rodar em produção.');
}

const adminEmails = () =>
  String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

// Promote e-mails listed in ADMIN_EMAILS the moment they sign in or sign up.
export function promoteIfAdmin(user) {
  if (user.role !== 'admin' && adminEmails().includes(user.email.toLowerCase())) {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
    user.role = 'admin';
  }
  return user;
}

export function startSession(res, userRow) {
  const token = jwt.sign({ sub: userRow.id }, JWT_SECRET, { expiresIn: `${MAX_AGE_DAYS}d` });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function endSession(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

const findUser = db.prepare('SELECT * FROM users WHERE id = ?');

// Attaches req.user (raw row) when a valid session cookie is present.
export function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const { sub } = jwt.verify(token, JWT_SECRET);
      req.user = findUser.get(sub) || null;
    } catch {
      req.user = null;
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Entre na sua conta para continuar.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Entre na sua conta para continuar.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito.' });
  next();
}

export const publicUser = toUser;
