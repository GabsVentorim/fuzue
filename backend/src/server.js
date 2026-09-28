import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { loadUser } from './auth.js';
import { UPLOAD_DIR } from './uploads.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import petRoutes from './routes/pets.js';
import shopRoutes from './routes/shop.js';
import adminRoutes from './routes/admin.js';

const PORT = process.env.PORT || 4000;
// Cookies need an explicit origin (not "*"). In dev the Vite proxy makes requests same-origin anyway.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: FRONTEND_ORIGIN.split(','), credentials: true }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(loadUser);

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/me/pets', petRoutes);
app.use('/api/me', meRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', shopRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro no servidor.' });
});

app.listen(PORT, () => console.log(`🐾 API rodando em http://localhost:${PORT}`));
