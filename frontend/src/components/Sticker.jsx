import { imageUrl } from '../assets';

// Die-cut stickers (and dog line doodles) in the look of the brand's sticker sheet (organic stars, bursts, smiley shapes,
// squiggles, rainbow, halftone) plus the two illustrated ones cut from it (name tag, employee of the month).
// Vector ones get a white die-cut edge (a white stroke painted under the fill).
const face = (cx, cy, s = 1, wink = false) => (
  <g className="sticker__face" fill="none" stroke="#1b1530" strokeWidth={2.6 * s} strokeLinecap="round">
    <circle cx={cx - 7 * s} cy={cy - 3 * s} r={1.9 * s} fill="#1b1530" stroke="none" className="sticker__eye" />
    {wink
      ? <path d={`M${cx + 4.5 * s} ${cy - 3 * s} q ${2.5 * s} ${-2.5 * s} ${5 * s} 0`} />
      : <circle cx={cx + 7 * s} cy={cy - 3 * s} r={1.9 * s} fill="#1b1530" stroke="none" className="sticker__eye" />}
    <path d={`M${cx - 6 * s} ${cy + 4 * s} q ${6 * s} ${6 * s} ${12 * s} 0`} />
  </g>
);

const SHAPES = {
  // soft organic five-point star
  star: (c) => <path d="M50 6 C56 26 60 32 92 36 C70 52 66 58 76 92 C56 76 46 76 24 92 C32 60 30 52 8 36 C40 32 44 26 50 6 Z" fill={c} />,
  // spiky burst
  burst: (c) => (
    <path fill={c} d="M50 4 L57 34 L80 12 L66 40 L96 40 L69 54 L90 78 L61 64 L58 96 L47 66 L24 90 L36 60 L5 60 L33 47 L12 22 L41 35 Z" />
  ),
  // eight-arm asterisk sparkle
  sparkle: (c) => (
    <g stroke={c} strokeWidth="9" strokeLinecap="round" fill="none">
      <path d="M50 10 V90 M10 50 H90 M22 22 L78 78 M78 22 L22 78" />
    </g>
  ),
  flower: (c, { faced, wink }) => (
    <>
      <path fill={c} d="M50 30 C50 8 80 8 74 30 C96 22 104 52 80 56 C96 74 74 96 60 78 C56 100 26 98 32 76 C10 86 0 58 22 52 C2 36 22 10 40 28 C42 18 50 18 50 30 Z" />
      {faced && face(51, 52, 1.3, wink)}
    </>
  ),
  heart: (c, { faced = true, wink }) => (
    <>
      <path fill={c} d="M50 88 C20 66 6 50 10 30 C14 12 38 8 50 28 C62 8 86 12 90 30 C94 50 80 66 50 88 Z" />
      {faced && face(50, 46, 1.25, wink)}
    </>
  ),
  triangle: (c, { faced = true, wink }) => (
    <>
      <path fill={c} d="M50 8 C55 8 92 78 90 84 C88 90 12 90 10 84 C8 78 45 8 50 8 Z" />
      {faced && face(50, 64, 1.15, wink)}
    </>
  ),
  squiggle: (c) => (
    <path d="M6 60 C 18 30, 30 30, 38 52 S 58 78, 66 50 S 86 22, 94 44" fill="none" stroke={c} strokeWidth="9" strokeLinecap="round" />
  ),
  rainbow: () => (
    <g fill="none" strokeWidth="8" strokeLinecap="round">
      <path d="M14 82 V62 a36 36 0 0 1 72 0 V82" stroke="#f08a7e" />
      <path d="M24 82 V62 a26 26 0 0 1 52 0 V82" stroke="#f2b33d" />
      <path d="M34 82 V62 a16 16 0 0 1 32 0 V82" stroke="#9ecfd3" />
      <path d="M43 82 V64 a7 7 0 0 1 14 0 V82" stroke="#8a97a8" />
    </g>
  ),
  halftone: (c) => {
    const dots = [];
    for (let y = 8; y <= 92; y += 8)
      for (let x = 8; x <= 92; x += 8) {
        const d = Math.hypot(x - 50, y - 50);
        if (d < 44) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={Math.max(0.6, 3.4 * (1 - d / 46))} />);
      }
    return <g fill={c}>{dots}</g>;
  },
};

// Line doodles of dogs, drawn like the logo: one colour, round strokes, no fill. Every path has
// pathLength=1 so the CSS can draw them in when they appear (see .sticker--doodle).
const D = (d, extra) => <path d={d} pathLength="1" {...extra} />;
const DOODLES = {
  dogHead: (
    <>
      {D('M30 40 C30 22 70 22 70 40 C74 62 62 76 50 76 C38 76 26 62 30 40 Z')}
      {D('M32 34 C18 30 14 52 22 60 C28 64 31 52 31 46')}
      {D('M68 34 C82 30 86 52 78 60 C72 64 69 52 69 46')}
      {D('M42 46 h0.01 M58 46 h0.01', { strokeWidth: 7 })}
      {D('M46 56 C46 53 54 53 54 56 C54 59 46 59 46 56 Z', { fill: 'currentColor' })}
      {D('M50 59 V63 M44 64 C47 67 50 65 50 63 C50 65 53 67 56 64')}
    </>
  ),
  dogSit: (
    <>
      {D('M36 30 C36 18 60 18 60 30 C60 40 54 44 48 44 C42 44 36 40 36 30 Z')}
      {D('M38 24 C30 24 27 36 33 41')}
      {D('M58 24 C66 24 69 36 63 41')}
      {D('M43 44 C35 52 32 70 36 84 H64 C68 70 64 52 55 44')}
      {D('M45 66 V84 M53 66 V84')}
      {D('M64 78 C74 78 81 70 77 61')}
      {D('M44 30 h0.01 M52 30 h0.01', { strokeWidth: 6 })}
      {D('M48 36 h0.01', { strokeWidth: 7 })}
    </>
  ),
  dachshund: (
    <>
      {D('M18 52 C18 44 26 42 34 42 H68 C76 42 80 46 80 52 C80 58 76 60 68 60 H34 C26 60 18 58 18 52 Z')}
      {D('M70 43 C69 33 77 28 85 30 C93 32 94 40 87 43')}
      {D('M80 31 C75 35 75 42 80 45')}
      {D('M30 60 V70 M40 60 V70 M62 60 V70 M72 60 V70')}
      {D('M18 50 C12 46 10 40 13 35')}
      {D('M85 35 h0.01', { strokeWidth: 6 })}
      {D('M93 38 h0.01', { strokeWidth: 7 })}
    </>
  ),
  bone: D('M30 44 C24 37 15 44 22 50 C15 56 24 63 30 56 H70 C76 63 85 56 78 50 C85 44 76 37 70 44 Z'),
  paw: (
    <>
      {D('M50 50 C40 50 35 63 41 70 C45 75 55 75 59 70 C65 63 60 50 50 50 Z')}
      {D('M28 44 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0')}
      {D('M38 33 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0')}
      {D('M50 33 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0')}
      {D('M60 44 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0')}
    </>
  ),
  ballZoom: (
    <>
      {D('M44 50 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0')}
      {D('M48 42 C54 46 58 54 56 61')}
      {D('M22 44 H34 M18 52 H32 M24 60 H34')}
    </>
  ),
};

const IMAGES = {
  ola: '/assets/stickers/ola-sou-fuzo.png',
  fdm: '/assets/stickers/funcionario-do-mes.png',
};

export default function Sticker({ kind, color = '#f7b6d9', faced, wink, outline = true }) {
  if (DOODLES[kind]) {
    return (
      <svg viewBox="0 0 100 100" className="sticker__svg sticker__doodle" style={{ color }} fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {DOODLES[kind]}
      </svg>
    );
  }
  if (IMAGES[kind]) return <img src={imageUrl(IMAGES[kind])} alt="" draggable={false} className="sticker__img" />;
  const draw = SHAPES[kind] || SHAPES.star;
  const plain = kind === 'halftone';
  return (
    <svg viewBox="-6 -6 112 112" className="sticker__svg" aria-hidden>
      {outline && !plain && (
        // the die-cut white edge: the same artwork, thickly stroked in white, under the coloured layer
        <g className="sticker__edge">{draw('#fff', { faced: false })}</g>
      )}
      {draw(color, { faced, wink })}
    </svg>
  );
}
