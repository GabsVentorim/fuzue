import { useLocation } from 'react-router-dom';
import Stickers from './Stickers';

// Stickers for every storefront page (the home places its own along the trail; admin stays clean).
// They live in the side gutters near the top of the page; the ones further down only show where the margins
// are wide enough (hideNarrow), and on phones only a small one sits by the title.
const gutterL = 'max(6px, calc((100% - 1180px) / 2 - 92px))';
const gutterR = 'max(6px, calc((100% - 1180px) / 2 - 86px))';

const SETS = {
  '/loja': [
    { kind: 'dogHead', color: '#fe2a0a', size: 76, top: 420, left: gutterL, rot: -8, hideMobile: true, hideNarrow: true },
    { kind: 'burst', color: '#ff2a0a', size: 62, top: 70, right: gutterR, rot: 12, m: { top: 58, right: 14, size: 46 } },
    { kind: 'flower', color: '#1e9bea', faced: true, size: 70, top: 260, left: gutterL, rot: -10, hideMobile: true, hideNarrow: true },
    { kind: 'squiggle', color: '#5b6cf0', size: 96, top: 520, right: gutterR, rot: 8, hideMobile: true, hideNarrow: true },
    { kind: 'star', color: '#9ecfd3', size: 58, top: 820, left: gutterL, rot: 16, hideMobile: true, hideNarrow: true },
  ],
  '/produto': [
    { kind: 'ballZoom', color: '#377df8', size: 70, top: 220, right: gutterR, hideMobile: true, hideNarrow: true },
    { kind: 'star', color: '#f7b6d9', size: 60, top: 60, right: gutterR, rot: -12, hideMobile: true },
    { kind: 'heart', color: '#f2232a', faced: true, wink: true, size: 58, top: 380, left: gutterL, rot: 10, hideMobile: true, hideNarrow: true },
  ],
  '/carrinho': [
    { kind: 'dogSit', color: '#fe2a0a', size: 84, top: 520, right: gutterR, rot: 6, hideMobile: true, hideNarrow: true },
    { kind: 'ola', size: 150, top: 40, right: gutterR, rot: 8, m: { top: 50, right: 10, size: 92 } },
    { kind: 'triangle', color: '#f2b33d', faced: true, size: 58, top: 300, left: gutterL, rot: -12, hideMobile: true, hideNarrow: true },
  ],
  '/checkout': [
    { kind: 'paw', color: '#fe2a0a', size: 48, top: 560, right: gutterR, rot: -12, hideMobile: true, hideNarrow: true },
    { kind: 'sparkle', color: '#ff2a0a', size: 44, top: 70, right: gutterR, hideMobile: true },
    { kind: 'flower', color: '#f7b6d9', faced: true, wink: true, size: 64, top: 340, left: gutterL, rot: 8, hideMobile: true, hideNarrow: true },
  ],
  '/pedido': [
    { kind: 'burst', color: '#f2b33d', size: 70, top: 60, left: gutterL, rot: -8, m: { top: 20, left: 12, size: 50 } },
    { kind: 'heart', color: '#f2232a', faced: true, wink: true, size: 64, top: 90, right: gutterR, rot: 12, m: { top: 30, right: 12, size: 48 } },
    { kind: 'star', color: '#9ecfd3', size: 56, top: 360, right: gutterR, rot: 20, hideMobile: true, hideNarrow: true },
  ],
  '/entrar': [
    { kind: 'dogHead', color: '#fe2a0a', size: 80, top: 360, right: gutterR, rot: 8, hideMobile: true, hideNarrow: true },
    { kind: 'fdm', size: 150, top: 60, left: gutterL, rot: -7, hideMobile: true },
    { kind: 'flower', color: '#1e9bea', faced: true, size: 66, top: 120, right: gutterR, rot: 10, m: { top: 14, right: 12, size: 48 } },
  ],
  '/guia-de-tamanhos': [
    { kind: 'dachshund', color: '#fe2a0a', size: 110, top: 160, left: gutterL, hideMobile: true, hideNarrow: true },
    { kind: 'rainbow', size: 100, top: 40, right: gutterR, rot: -6, m: { top: 30, right: 10, size: 64 } },
    { kind: 'triangle', color: '#f2b33d', faced: true, size: 56, top: 360, left: gutterL, rot: -14, hideMobile: true, hideNarrow: true },
  ],
  '/minha-conta': [
    { kind: 'bone', color: '#377df8', size: 70, top: 300, left: gutterL, rot: -14, hideMobile: true, hideNarrow: true },
    { kind: 'star', color: '#f7b6d9', size: 54, top: 120, right: gutterR, rot: 14, hideMobile: true, hideNarrow: true },
  ],
  '*': [
    { kind: 'burst', color: '#ff2a0a', size: 60, top: 70, right: gutterR, rot: 10, hideMobile: true },
    { kind: 'flower', color: '#f7b6d9', faced: true, size: 64, top: 240, left: gutterL, rot: -8, hideMobile: true, hideNarrow: true },
  ],
};

export default function PageStickers() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/fita-metrica')) return null;
  const key = Object.keys(SETS).find((k) => k !== '*' && pathname.startsWith(k)) || '*';
  return <Stickers items={SETS[key]} />;
}
