// Restores products from products.seed.json and clears orders and stock history.
// Users, addresses and pets are kept.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import db, { seedProducts } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(path.join(__dirname, '..', 'src', 'data', 'products.seed.json'), 'utf8'));

db.transaction(() => {
  db.exec('DELETE FROM stock_movements; DELETE FROM orders; DELETE FROM products;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('products', 'stock_movements')");
})();
seedProducts(seed);
console.log(`🔄 ${seed.length} produtos restaurados, pedidos e histórico de estoque apagados.`);
