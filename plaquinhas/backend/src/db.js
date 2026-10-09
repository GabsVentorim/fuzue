import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, 'data');
export const DB_DIR = path.join(__dirname, '..', 'data');
export const DB_FILE = process.env.DB_FILE || path.join(DB_DIR, 'fuzue-tags.db');

mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Uma plaquinha (medalha com NFC + QR Code) presa à coleira do pet.
-- "code" é o que vai gravado na medalha e aparece na URL pública /tag/CR-XXXXX.
CREATE TABLE IF NOT EXISTS tags (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  code               TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pet_name           TEXT NOT NULL,
  species            TEXT NOT NULL CHECK (species IN ('cachorro', 'gato', 'outro')),
  sex                TEXT CHECK (sex IN ('macho', 'femea')),
  breed              TEXT,
  is_mixed           INTEGER NOT NULL DEFAULT 0,
  size               TEXT CHECK (size IN ('mini', 'pequeno', 'medio', 'grande', 'gigante')),
  photo_url          TEXT,
  notes              TEXT,
  tutor_name         TEXT NOT NULL,
  tutor_neighborhood TEXT NOT NULL,
  tutor_phone        TEXT,
  tutor_whatsapp     TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'perdido', 'inativo')),
  created_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_tags_status ON tags(status);
CREATE INDEX IF NOT EXISTS idx_tags_created_by ON tags(created_by);
`);

// ---------- migrações para bancos criados por versões anteriores ----------
const hasColumn = (table, col) => db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col);
// Quantas vezes a plaquinha já foi escaneada, e quando foi a última.
if (!hasColumn('tags', 'scan_count')) db.exec('ALTER TABLE tags ADD COLUMN scan_count INTEGER NOT NULL DEFAULT 0');
if (!hasColumn('tags', 'last_scan_at')) db.exec('ALTER TABLE tags ADD COLUMN last_scan_at TEXT');

// ---------- primeira execução: importa o JSON de exemplo ----------
const readSeed = (file) => {
  const p = path.join(SEED_DIR, file);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
};

const insertTag = db.prepare(`
  INSERT OR IGNORE INTO tags (code, pet_name, species, sex, breed, is_mixed, size, photo_url, notes,
    tutor_name, tutor_neighborhood, tutor_phone, tutor_whatsapp, status, created_at)
  VALUES (@code, @pet_name, @species, @sex, @breed, @is_mixed, @size, @photo_url, @notes,
    @tutor_name, @tutor_neighborhood, @tutor_phone, @tutor_whatsapp, @status, @created_at)
`);

export function seedTags(tags) {
  db.transaction(() => {
    for (const t of tags) {
      insertTag.run({
        code: t.code,
        pet_name: t.petName,
        species: t.species,
        sex: t.sex || null,
        breed: t.breed || null,
        is_mixed: t.isMixed ? 1 : 0,
        size: t.size || null,
        photo_url: t.photoUrl || null,
        notes: t.notes || null,
        tutor_name: t.tutorName,
        tutor_neighborhood: t.tutorNeighborhood,
        tutor_phone: t.tutorPhone || null,
        tutor_whatsapp: t.tutorWhatsapp,
        status: t.status || 'ativo',
        created_at: t.createdAt || new Date().toISOString(),
      });
    }
  })();
}

if (db.prepare('SELECT COUNT(*) AS n FROM tags').get().n === 0) {
  const tags = readSeed('tags.seed.json') || [];
  if (tags.length) {
    seedTags(tags);
    console.log(`🏷️  Banco criado com ${tags.length} plaquinha(s) de exemplo.`);
  }
}

// ---------- row mappers ----------
export const toUser = (r) =>
  r && {
    id: r.id,
    email: r.email,
    name: r.name,
    phone: r.phone || '',
    avatarUrl: r.avatar_url || null,
    role: r.role,
    hasPassword: !!r.password_hash,
    createdAt: r.created_at,
  };

// Visão completa da plaquinha — só para o painel admin.
export const toTag = (r) =>
  r && {
    id: r.id,
    code: r.code,
    petName: r.pet_name,
    species: r.species,
    sex: r.sex,
    breed: r.breed || '',
    isMixed: !!r.is_mixed,
    size: r.size,
    photoUrl: r.photo_url || null,
    notes: r.notes || '',
    tutorName: r.tutor_name,
    tutorNeighborhood: r.tutor_neighborhood,
    tutorPhone: r.tutor_phone || '',
    tutorWhatsapp: r.tutor_whatsapp,
    status: r.status,
    scanCount: r.scan_count || 0,
    lastScanAt: r.last_scan_at || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at || null,
  };

// Visão pública (quem escaneou a medalha): só o necessário para devolver o pet.
// Nunca expõe o id interno, quem cadastrou, nem contadores.
export const toPublicTag = (r) =>
  r && {
    code: r.code,
    petName: r.pet_name,
    species: r.species,
    sex: r.sex,
    breed: r.breed || '',
    isMixed: !!r.is_mixed,
    size: r.size,
    photoUrl: r.photo_url || null,
    notes: r.notes || '',
    tutorName: r.tutor_name,
    tutorNeighborhood: r.tutor_neighborhood,
    tutorPhone: r.tutor_phone || '',
    tutorWhatsapp: r.tutor_whatsapp,
    status: r.status,
  };

export default db;
