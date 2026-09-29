// Display labels and small helpers shared by the account and admin pages.

export const ORDER_STATUS = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const PAYMENT = { pix: 'Pix', cartao: 'Cartão', boleto: 'Boleto' };

export const SPECIES = { cachorro: 'Cachorro', gato: 'Gato' };
export const SEX = { macho: 'Macho', femea: 'Fêmea' };

export const PET_SIZES = {
  mini: 'Mini (até 5 kg)',
  pequeno: 'Pequeno (5–10 kg)',
  medio: 'Médio (10–25 kg)',
  grande: 'Grande (25–45 kg)',
  gigante: 'Gigante (45 kg+)',
};

export const BREEDS = {
  cachorro: [
    'Shih Tzu', 'Yorkshire', 'Poodle', 'Lhasa Apso', 'Maltês', 'Spitz Alemão (Lulu)', 'Pinscher',
    'Chihuahua', 'Dachshund (Salsicha)', 'Pug', 'Bulldog Francês', 'Bulldog Inglês', 'Beagle',
    'Schnauzer', 'Cocker Spaniel', 'Border Collie', 'Golden Retriever', 'Labrador', 'Pastor Alemão',
    'Husky Siberiano', 'Rottweiler', 'Boxer', 'Pit Bull', 'Dobermann', 'Akita', 'Chow Chow',
    'Jack Russell Terrier', 'Cavalier King Charles', 'Bernese', 'Dálmata',
  ],
  gato: [
    'Persa', 'Siamês', 'Maine Coon', 'Angorá', 'Ragdoll', 'British Shorthair', 'Sphynx',
    'Bengal', 'Exótico', 'Himalaio', 'Sagrado da Birmânia', 'Scottish Fold',
  ],
};

// Date-only values (YYYY-MM-DD, e.g. birthdays) are formatted as-is to avoid timezone shifts.
export const formatDate = (iso) => {
  if (!iso) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.split('-').reverse().join('/');
  return new Date(iso).toLocaleDateString('pt-BR');
};
export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

// "2 anos e 3 meses", "5 meses", "recém-nascido"
export function petAge(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate + 'T00:00:00');
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) months--;
  if (months < 1) return 'recém-nascido';
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} ano${y > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} ${m > 1 ? 'meses' : 'mês'}`);
  return parts.join(' e ');
}

// Collar size from the neck measurement — the size table lives in sizes.js.
export { collarSize } from './sizes';
