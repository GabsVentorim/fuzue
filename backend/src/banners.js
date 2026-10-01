// Home carousel banners ("novidades", brand collections…), managed in Admin → Carrossel.
import db from './db.js';

db.exec(`
CREATE TABLE IF NOT EXISTS banners (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT,
  subtitle     TEXT,
  image        TEXT NOT NULL,
  image_mobile TEXT,
  link_url     TEXT,
  button_label TEXT,
  position     INTEGER NOT NULL DEFAULT 0,
  active       INTEGER NOT NULL DEFAULT 1,
  starts_at    TEXT,
  ends_at      TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

export const toBanner = (r) =>
  r && {
    id: r.id,
    title: r.title || '',
    subtitle: r.subtitle || '',
    image: r.image,
    imageMobile: r.image_mobile || null,
    linkUrl: r.link_url || '',
    buttonLabel: r.button_label || '',
    position: r.position,
    active: !!r.active,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
  };

const today = () => new Date().toISOString().slice(0, 10);

// What the home page shows: active banners inside their date window, in order.
export const liveBanners = () =>
  db.prepare(`SELECT * FROM banners WHERE active = 1
      AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?)
    ORDER BY position, id`).all(today(), today()).map(toBanner);

export const allBanners = () => db.prepare('SELECT * FROM banners ORDER BY position, id').all().map(toBanner);
