// Single source for collar sizes: the size table, the breed → neck guide and the size finder.
// Used by the home size guide, the printable tape measure page and the pet cards.

export const SIZES = [
  { id: 'PP', min: 15, max: 20, hint: 'filhotes, gatos e cães bem pequenos' },
  { id: 'P', min: 20, max: 30, hint: 'gatos e cães pequenos' },
  { id: 'M', min: 30, max: 42, hint: 'cães médios' },
  { id: 'G', min: 42, max: 55, hint: 'cães grandes' },
  { id: 'GG', min: 55, max: 70, hint: 'cães gigantes' },
];

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
  mini: { label: 'Mini (até 5 kg)', min: 18, max: 28 },
  pequeno: { label: 'Pequeno (5–10 kg)', min: 25, max: 35 },
  medio: { label: 'Médio (10–25 kg)', min: 32, max: 45 },
  grande: { label: 'Grande (25–45 kg)', min: 42, max: 58 },
  gigante: { label: 'Gigante (45 kg+)', min: 55, max: 70 },
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
