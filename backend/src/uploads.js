import multer from 'multer';
import { mkdirSync, rmSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const MAX_MB = 5;

// Returns a multer middleware that stores a single "image" field in uploads/<folder>/.
export function imageUpload(folder) {
  const dir = path.join(UPLOAD_DIR, folder);
  mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (_req, file, cb) => cb(null, Date.now() + '-' + randomBytes(4).toString('hex') + EXT[file.mimetype]),
    }),
    limits: { fileSize: MAX_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) =>
      EXT[file.mimetype] ? cb(null, true) : cb(new Error('Envie uma imagem JPG, PNG, WEBP ou GIF.')),
  }).single('image');
}

// Public URL for a stored file, e.g. /uploads/products/123.jpg
export const publicPath = (folder, file) => `/uploads/${folder}/${file.filename}`;

// Deletes a previously uploaded file (ignores anything not under /uploads/).
export function removeUpload(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const file = path.join(UPLOAD_DIR, url.slice('/uploads/'.length));
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return;
  rmSync(file, { force: true });
}
