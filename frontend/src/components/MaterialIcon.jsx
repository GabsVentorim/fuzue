// Line icons for the product's "Materiais e detalhes". Every stroke uses pathLength=1 so the CSS can
// draw it in (stroke-dashoffset 1 → 0) when the section comes into view.
const P = (props) => <path pathLength="1" {...props} />;

const ICONS = {
  // braided cord: two strands crossing
  cord: (
    <>
      <P d="M4 20 C 8 16, 8 12, 12 12 S 16 8, 20 4" />
      <P d="M4 4 C 8 8, 8 12, 12 12 S 16 16, 20 20" />
      <P d="M7 6.5 l2 -1 M15 18.5 l2 -1 M6.5 17 l1 2 M16.5 5 l1 2" />
    </>
  ),
  // metal D-ring
  ring: (
    <>
      <P d="M7 5 h10 v6 a5 5 0 0 1 -10 0 z" />
      <P d="M12 16 v4" />
    </>
  ),
  // quick-release buckle
  buckle: (
    <>
      <P d="M3 9 h6 l3 3 -3 3 h-6 z" />
      <P d="M21 9 h-7 l-3 3 3 3 h7 z" />
      <P d="M16 11 h3 M16 13 h3" />
    </>
  ),
  // made by hand
  hand: (
    <>
      <P d="M8 13 V6.5 a1.5 1.5 0 0 1 3 0 V11 M11 10 V5 a1.5 1.5 0 0 1 3 0 v6 M14 10 V6.5 a1.5 1.5 0 0 1 3 0 V14 a6 6 0 0 1 -6 6 h-1 a5 5 0 0 1 -4 -2 l-2.6 -3.6 a1.5 1.5 0 0 1 2.4 -1.8 L8 14" />
    </>
  ),
  // fabric / print
  fabric: (
    <>
      <P d="M4 6 q4 -3 8 0 t8 0 v12 q-4 -3 -8 0 t-8 0 z" />
      <P d="M8 10 h.01 M12 13 h.01 M16 10 h.01 M9 16 h.01 M15 16 h.01" />
    </>
  ),
  sparkle: <P d="M12 3 l2 6.5 6.5 2 -6.5 2 -2 6.5 -2 -6.5 -6.5 -2 6.5 -2 z" />,
};

export const MATERIAL_ICONS = [
  ['cord', 'Cordão / trançado'],
  ['ring', 'Argola'],
  ['buckle', 'Fivela'],
  ['hand', 'Feito à mão'],
  ['fabric', 'Tecido / estampa'],
  ['sparkle', 'Detalhe'],
];

export default function MaterialIcon({ name, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {ICONS[name] || ICONS.sparkle}
    </svg>
  );
}
