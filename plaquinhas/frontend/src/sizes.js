// Tabela de tamanhos de coleira, medida de pescoço por raça e o porte que decorre dela.
// Os números vêm da loja fuzue, para a plaquinha e a coleira falarem a mesma língua.

// Cada tamanho serve um pescoço de ATÉ `max` cm (medido com dois dedinhos de folga).
export const COLLAR_SIZES = [
  { id: 'XPP', min: 0, max: 25, hint: 'filhotes e cães bem pequenos' },
  { id: 'PP', min: 25, max: 30, hint: 'gatos e cães mini' },
  { id: 'P', min: 30, max: 35, hint: 'cães pequenos' },
  { id: 'M', min: 35, max: 40, hint: 'cães pequenos a médios' },
  { id: 'G', min: 40, max: 45, hint: 'cães médios' },
  { id: 'GG', min: 45, max: 50, hint: 'cães médios a grandes' },
  { id: 'XG', min: 50, max: 55, hint: 'cães grandes' },
  { id: 'XXG', min: 55, max: 60, hint: 'cães grandes e gigantes' },
];

// Circunferência típica do pescoço ADULTO (cm). Cada bicho é um bicho — medir é sempre melhor.
export const BREED_NECKS = [
  ['Akita', 50, 65], ['Beagle', 33, 40], ['Bernese', 55, 65], ['Border Collie', 38, 48],
  ['Boxer', 42, 55], ['Bulldog Francês', 33, 42], ['Bulldog Inglês', 45, 60],
  ['Cavalier King Charles', 30, 38], ['Chihuahua', 18, 25], ['Chow Chow', 45, 60],
  ['Cocker Spaniel', 36, 42], ['Dachshund (Salsicha)', 28, 38], ['Dálmata', 42, 52],
  ['Dobermann', 45, 55], ['Golden Retriever', 45, 55], ['Husky Siberiano', 40, 50],
  ['Jack Russell Terrier', 30, 36], ['Labrador', 45, 55], ['Lhasa Apso', 28, 35],
  ['Maltês', 20, 28], ['Pastor Alemão', 45, 60], ['Pinscher', 20, 28], ['Pit Bull', 42, 55],
  ['Poodle', 22, 32], ['Pug', 30, 38],
  ['Rottweiler', 55, 65], ['Schnauzer', 28, 38], ['Shih Tzu', 28, 35],
  ['Spitz Alemão (Lulu)', 22, 30], ['Yorkshire', 20, 28],
].map(([name, min, max]) => ({ name, min, max }));

// Para vira-latas (SRD) — as chaves batem com o campo "size" da plaquinha.
export const PORTE_NECKS = {
  mini: { min: 18, max: 26 },
  pequeno: { min: 26, max: 34 },
  medio: { min: 35, max: 44 },
  grande: { min: 45, max: 55 },
  gigante: { min: 55, max: 65 },
};

const normalize = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// Acha a medida de pescoço de uma raça escrita à mão. Tenta o nome exato e, se não achar,
// o começo do nome — assim "Poodle Toy" ainda encontra "Poodle".
export function neckForBreed(breed) {
  const q = normalize(breed);
  if (!q) return null;
  return (
    BREED_NECKS.find((b) => normalize(b.name) === q) ||
    BREED_NECKS.find((b) => q.startsWith(normalize(b.name)) || normalize(b.name).startsWith(q)) ||
    null
  );
}

// Tamanho de coleira para uma medida exata de pescoço (cm).
export const collarSizeForNeck = (cm) =>
  !cm ? null : COLLAR_SIZES.find((s) => cm <= s.max && cm >= s.min)?.id || null;

// Porte provável de uma raça. Usa o meio da faixa de pescoço e procura o porte cuja
// faixa o contém; nas folgas entre as faixas, fica com a mais próxima.
export function porteForBreed(breed) {
  const neck = neckForBreed(breed);
  if (!neck) return null;
  const mid = (neck.min + neck.max) / 2;

  let best = null;
  let bestDistance = Infinity;
  for (const [porte, range] of Object.entries(PORTE_NECKS)) {
    const distance = mid < range.min ? range.min - mid : mid > range.max ? mid - range.max : 0;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = porte;
    }
  }
  return best;
}

// Tamanhos de coleira que cobrem a faixa de pescoço da raça, ex.: "P ou M".
export function collarSizesForBreed(breed) {
  const neck = neckForBreed(breed);
  if (!neck) return [];
  return COLLAR_SIZES.filter((s) => s.max > neck.min && s.min < neck.max).map((s) => s.id);
}
