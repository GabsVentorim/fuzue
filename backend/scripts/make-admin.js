// Usage: npm run make-admin -- email@exemplo.com
import 'dotenv/config';
import db from '../src/db.js';

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Uso: npm run make-admin -- email@exemplo.com');
  process.exit(1);
}

const { changes } = db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
if (!changes) {
  console.error(`Nenhuma conta com o e-mail ${email}. Crie a conta no site primeiro.`);
  process.exit(1);
}
console.log(`✅ ${email} agora é admin.`);
