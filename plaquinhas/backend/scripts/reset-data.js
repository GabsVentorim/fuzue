// Apaga TODAS as plaquinhas e recarrega as de exemplo (src/data/tags.seed.json).
// As contas de administrador não são tocadas.
// Uso: npm run reset-data -- --sim
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import db, { seedTags } from '../src/db.js';

if (!process.argv.includes('--sim')) {
  console.error('Isso apaga todas as plaquinhas cadastradas. Confirme com: npm run reset-data -- --sim');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(path.join(__dirname, '..', 'src', 'data', 'tags.seed.json'), 'utf8'));

const { changes } = db.prepare('DELETE FROM tags').run();
seedTags(seed);
console.log(`🧹 ${changes} plaquinha(s) apagada(s). ${seed.length} de exemplo recarregada(s).`);
