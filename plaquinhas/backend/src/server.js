import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { loadUser } from './auth.js';
import { UPLOAD_DIR } from './uploads.js';
import { readBrand } from './util.js';
import authRoutes from './routes/auth.js';
import tagRoutes from './routes/tags.js';
import adminRoutes from './routes/admin.js';

const PORT = process.env.PORT || 4100;
// O cookie exige uma origem explícita (não "*"). Em desenvolvimento o proxy do Vite
// deixa as requisições na mesma origem de qualquer forma.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5273';

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: FRONTEND_ORIGIN.split(','), credentials: true }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(loadUser);

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/brand', (_req, res) => res.json(readBrand()));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tags', tagRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro no servidor.' });
});

app
  .listen(PORT, () => console.log(`🏷️  API das plaquinhas rodando em http://localhost:${PORT}`))
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `❌ A porta ${PORT} já está em uso — provavelmente outro backend já está rodando em outro terminal.\n` +
          `   Feche-o (Ctrl+C) ou mude PORT no .env.`
      );
      process.exit(1);
    }
    throw err;
  });
