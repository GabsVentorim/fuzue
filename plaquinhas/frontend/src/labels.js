// Rótulos de exibição e ajudantes pequenos, compartilhados pelas páginas.

export const SPECIES = { cachorro: 'Cachorro', gato: 'Gato', outro: 'Outro' };
export const SEX = { macho: 'Macho', femea: 'Fêmea' };
export const SEX_SYMBOL = { macho: '♂ Macho', femea: '♀ Fêmea' };

export const PET_SIZES = {
  mini: 'Mini (até 5 kg)',
  pequeno: 'Pequeno (5–10 kg)',
  medio: 'Médio (10–25 kg)',
  grande: 'Grande (25–45 kg)',
  gigante: 'Gigante (45 kg+)',
};
export const PET_SIZES_SHORT = {
  mini: 'Mini', pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande', gigante: 'Gigante',
};

export const TAG_STATUS = { ativo: 'Ativa', perdido: 'Pet perdido', inativo: 'Desativada' };

// A mesma lista de raças da loja fuzue, para a plaquinha e a coleira falarem a mesma língua.
// É uma sugestão, não uma trava: o campo aceita qualquer raça digitada.
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
  outro: [],
};

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

// "Golden Retriever", "Vira-lata (SRD)" ou "Cachorro" quando não há nada melhor.
export const breedLabel = (tag) =>
  tag.isMixed ? 'Vira-lata (SRD)' : tag.breed || SPECIES[tag.species] || '';
