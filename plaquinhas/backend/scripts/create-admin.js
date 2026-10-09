// Cria (ou atualiza a senha de) uma conta de administrador.
// Uso: npm run create-admin -- email@exemplo.com "senha-forte" "Nome da Pessoa"
//
// Não existe cadastro público no site — toda conta da loja nasce por aqui.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db, { toUser } from '../src/db.js';

const [emailArg, password, nameArg] = process.argv.slice(2);
const email = String(emailArg || '').trim().toLowerCase();
const name = String(nameArg || '').trim() || email.split('@')[0];

if (!email || !password) {
  console.error('Uso: npm run create-admin -- email@exemplo.com "senha-forte" "Nome da Pessoa"');
  process.exit(1);
}
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error('E-mail inválido.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('A senha precisa ter pelo menos 8 caracteres.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

if (existing) {
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(hash, existing.id);
  console.log(`🔑 Senha atualizada e papel confirmado como admin: ${email}`);
} else {
  db.prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run(email, name, hash);
  console.log(`✅ Admin criado: ${email}`);
}

const user = toUser(db.prepare('SELECT * FROM users WHERE email = ?').get(email));
console.log(`   Nome: ${user.name} · papel: ${user.role}`);
console.log('   Entre em http://localhost:5273/entrar');
