import { imageUrl } from '../assets';

// Die-cut stickers in the look of the brand's sticker sheet (organic stars, bursts, smiley shapes,
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

const IMAGES = {
  ola: '/assets/stickers/ola-sou-fuzo.png',
  fdm: '/assets/stickers/funcionario-do-mes.png',
};

export default function Sticker({ kind, color = '#f7b6d9', faced, wink, outline = true }) {
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
