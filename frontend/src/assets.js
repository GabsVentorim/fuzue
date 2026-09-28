// Single place that knows where images live.
// Fixed site images (logo, favicon, hero, ...) are configured in the "assets" section of
// /brand.config.json and stored in frontend/public/assets/. Uploaded images (products, pets)
// come from the API as /uploads/... paths. Components must get every image URL from here.
import brand from './brand';

// Where /uploads/... is served from. Empty in dev (Vite proxies it); in production it's the
// API host, derived from VITE_API_URL (https://api.site.com/api → https://api.site.com).
const API_URL = import.meta.env.VITE_API_URL || '';
const UPLOADS_ORIGIN = import.meta.env.VITE_UPLOADS_URL || API_URL.replace(/\/api\/?$/, '');

// Resolves any stored image path to a URL the browser can load.
export function imageUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  if (path.startsWith('/uploads/')) return UPLOADS_ORIGIN + path;
  return path;
}

// Looks up a configured site image by key, e.g. asset('logo') or asset('categories.coleiras').
// Returns '' when not configured, so callers can fall back to the illustrated version.
export function asset(key) {
  const value = key.split('.').reduce((obj, k) => obj?.[k], brand.assets || {});
  return imageUrl(typeof value === 'string' ? value : '');
}
