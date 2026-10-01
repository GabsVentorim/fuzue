// Single source for collar sizes: the size table, the breed → neck guide and the size finder.
// Used by the home size guide, the printable tape measure page and the pet cards.

// Each size fits a neck UP TO `max` cm (measured with two fingers of slack).
export const SIZES = [
  { id: 'XPP', min: 0, max: 25, hint: 'filhotes e cães bem pequenos' },
  { id: 'PP', min: 25, max: 30, hint: 'gatos e cães mini' },
  { id: 'P', min: 30, max: 35, hint: 'cães pequenos' },
  { id: 'M', min: 35, max: 40, hint: 'cães pequenos a médios' },
  { id: 'G', min: 40, max: 45, hint: 'cães médios' },
  { id: 'GG', min: 45, max: 50, hint: 'cães médios a grandes' },
  { id: 'XG', min: 50, max: 55, hint: 'cães grandes' },
  { id: 'XXG', min: 55, max: 60, hint: 'cães grandes e gigantes' },
];

// "até 25 cm", "26–30 cm", …
export const sizeRange = (s, i = SIZES.indexOf(s)) => (i === 0 ? `até ${s.max} cm` : `${s.min + 1}–${s.max} cm`);

// Typical ADULT neck circumference (cm). Individuals vary — measuring is always best.
export const BREED_NECKS = [
  ['Akita', 50, 65], ['Beagle', 33, 40], ['Bernese', 55, 65], ['Border Collie', 38, 48],
  ['Boxer', 42, 55], ['Bulldog Francês', 33, 42], ['Bulldog Inglês', 45, 60],
  ['Cavalier King Charles', 30, 38], ['Chihuahua', 18, 25], ['Chow Chow', 45, 60],
  ['Cocker Spaniel', 36, 42], ['Dachshund (Salsicha)', 28, 38], ['Dálmata', 42, 52],
  ['Dobermann', 45, 55], ['Golden Retriever', 45, 55], ['Husky Siberiano', 40, 50],
  ['Jack Russell Terrier', 30, 36], ['Labrador', 45, 55], ['Lhasa Apso', 28, 35],
  ['Maltês', 20, 28], ['Pastor Alemão', 45, 60], ['Pinscher', 20, 28], ['Pit Bull', 42, 55],
  ['Poodle (toy/mini)', 22, 32], ['Poodle (médio/standard)', 35, 48], ['Pug', 30, 38],
  ['Rottweiler', 55, 65], ['Schnauzer', 28, 38], ['Shih Tzu', 28, 35],
  ['Spitz Alemão (Lulu)', 22, 30], ['Yorkshire', 20, 28],
].map(([name, min, max]) => ({ name, min, max }));

// For mixed-breed dogs (SRD) — keys match the pet "size" field.
export const PORTE_NECKS = {
  mini: { label: 'Mini (até 5 kg)', min: 18, max: 26 },
  pequeno: { label: 'Pequeno (5–10 kg)', min: 26, max: 34 },
  medio: { label: 'Médio (10–25 kg)', min: 35, max: 44 },
  grande: { label: 'Grande (25–45 kg)', min: 45, max: 55 },
  gigante: { label: 'Gigante (45 kg+)', min: 55, max: 65 },
};

// Size for an exact neck measurement (cm), or null when out of range.
export function sizeForNeck(cm) {
  if (!cm) return null;
  return SIZES.find((s) => cm <= s.max && cm >= s.min) || null;
}

// Sizes covered by a neck range, e.g. 28–35 cm → [P, M].
export function sizesForRange(min, max) {
  return SIZES.filter((s) => s.max > min && s.min < max).map((s) => s.id);
}

// Text for pet cards: "M", or a message when the measurement is outside our sizes.
export function collarSize(neckCm) {
  if (!neckCm) return null;
  if (neckCm < SIZES[0].min) return `menor que ${SIZES[0].id} — fale com a gente`;
  const last = SIZES[SIZES.length - 1];
  if (neckCm > last.max) return `maior que ${last.id} — fale com a gente`;
  return sizeForNeck(neckCm).id;
}

// A size is always pre-selected: "M" when the product has it, otherwise the middle one (or the only one).
export const defaultSize = (sizes = []) =>
  !sizes.length ? '' : sizes.includes('M') ? 'M' : sizes[Math.floor((sizes.length - 1) / 2)];
