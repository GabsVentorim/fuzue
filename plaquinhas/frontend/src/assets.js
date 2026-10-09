// Único lugar que sabe onde as imagens ficam.
// Imagens fixas do site (logo, favicon) são configuradas na seção "assets" de
// /brand.config.json e guardadas em frontend/public/assets/. Fotos enviadas pelo painel
// chegam da API como caminhos /uploads/... Os componentes pegam toda URL de imagem daqui.
import brand from './brand';

const API_URL = import.meta.env.VITE_API_URL || '';
const UPLOADS_ORIGIN = import.meta.env.VITE_UPLOADS_URL || API_URL.replace(/\/api\/?$/, '');

// Resolve qualquer caminho guardado para uma URL que o navegador consegue carregar.
export function imageUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  if (path.startsWith('/uploads/')) return UPLOADS_ORIGIN + path;
  return path;
}

// Busca uma imagem fixa do site pela chave, ex.: asset('logo').
// Devolve '' quando não está configurada, para quem chama cair no desenho padrão.
export function asset(key) {
  const value = key.split('.').reduce((obj, k) => obj?.[k], brand.assets || {});
  return imageUrl(typeof value === 'string' ? value : '');
}
