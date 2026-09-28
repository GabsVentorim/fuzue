import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import { asset, imageUrl } from '../../assets';
import { BREEDS, PET_SIZES, SEX, SPECIES, collarSize, formatDate, petAge } from '../../labels';

const empty = {
  name: '', species: 'cachorro', sex: '', birthDate: '', birthDateEstimated: false,
  isMixed: false, breed: '', size: '', weightKg: '', neckCm: '', coatColor: '', neutered: false, notes: '',
};

const today = () => new Date().toISOString().slice(0, 10);

function PetForm({ pet, onSaved, onCancel }) {
  const [form, setForm] = useState(() => (pet ? { ...empty, ...pet, sex: pet.sex || '', size: pet.size || '', birthDate: pet.birthDate || '', weightKg: pet.weightKg ?? '', neckCm: pet.neckCm ?? '' } : empty));
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const blobUrl = useMemo(() => photo && URL.createObjectURL(photo), [photo]);
  useEffect(() => () => blobUrl && URL.revokeObjectURL(blobUrl), [blobUrl]);
  const preview = blobUrl || imageUrl(pet?.photoUrl);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      let saved = pet ? await api.updatePet(pet.id, form) : await api.addPet(form);
      if (photo) saved = await api.uploadPetPhoto(saved.id, photo);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <fieldset className="box">
        <legend>{pet ? `Editar ${pet.name}` : 'Novo pet'}</legend>

        <div className="pet-photo field--full">
          <img src={preview || asset('petPlaceholder')} alt="" />
          <label className="btn btn--ghost btn--sm">
            {preview ? 'Trocar foto' : 'Adicionar foto'}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => setPhoto(e.target.files[0] || null)} />
          </label>
        </div>

        <label className="field">Nome<input className="input" required value={form.name} onChange={set('name')} /></label>
        <div className="field">
          <span>Espécie</span>
          <div className="seg">
            {Object.entries(SPECIES).map(([k, label]) => (
              <label key={k} className={`seg__opt ${form.species === k ? 'seg__opt--on' : ''}`}>
                <input type="radio" name="species" value={k} checked={form.species === k} onChange={set('species')} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <label className="field">
          Sexo
          <select className="input" value={form.sex} onChange={set('sex')}>
            <option value="">Não informar</option>
            {Object.entries(SEX).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="field">
          Data de nascimento
          <input className="input" type="date" max={today()} value={form.birthDate} onChange={set('birthDate')} />
          <span className="check check--sm">
            <input type="checkbox" checked={form.birthDateEstimated} onChange={set('birthDateEstimated')} /> Data aproximada (adotado, não sei ao certo)
          </span>
        </label>

        <label className="check field--full">
          <input type="checkbox" checked={form.isMixed} onChange={set('isMixed')} />
          {form.species === 'gato' ? 'Sem raça definida (SRD)' : 'Vira-lata / sem raça definida (SRD)'}
        </label>

        {!form.isMixed && (
          <label className="field">
            Raça
            <input className="input" required list="breeds" placeholder="Comece a digitar…" value={form.breed} onChange={set('breed')} />
            <datalist id="breeds">
              {BREEDS[form.species].map((b) => <option key={b} value={b} />)}
            </datalist>
          </label>
        )}
        <label className="field">
          Porte{form.isMixed && ' *'}
          <select className="input" required={form.isMixed} value={form.size} onChange={set('size')}>
            <option value="">{form.isMixed ? 'Escolha o porte' : 'Não informar'}</option>
            {Object.entries(PET_SIZES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>

        <label className="field">Peso (kg)<input className="input" inputMode="decimal" placeholder="ex.: 8,5" value={form.weightKg} onChange={set('weightKg')} /></label>
        <label className="field">
          Pescoço (cm)
          <input className="input" inputMode="decimal" placeholder="ex.: 32" value={form.neckCm} onChange={set('neckCm')} />
          <small className="muted">Meça com fita métrica e some 2 dedinhos de folga. Usamos para sugerir o tamanho.</small>
        </label>
        <label className="field">Cor da pelagem<input className="input" placeholder="caramelo, preto e branco…" value={form.coatColor} onChange={set('coatColor')} /></label>
        <label className="check">
          <input type="checkbox" checked={form.neutered} onChange={set('neutered')} /> {form.sex === 'femea' ? 'Castrada' : 'Castrado'}
        </label>
        <label className="field field--full">
          Alergias ou observações
          <textarea className="input" rows={3} placeholder="Alergia a níquel, pele sensível, muito agitado no banho…" value={form.notes} onChange={set('notes')} />
        </label>

        {error && <p className="alert field--full">{error}</p>}
        <div className="row field--full">
          <button className="btn btn--primary" disabled={sending}>{sending ? 'Salvando…' : 'Salvar pet'}</button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        </div>
      </fieldset>
    </form>
  );
}

export function PetCard({ pet, children }) {
  const age = petAge(pet.birthDate);
  const collar = collarSize(pet.neckCm);
  return (
    <div className="pet-card">
      <img src={imageUrl(pet.photoUrl) || asset('petPlaceholder')} alt={pet.name} className="pet-card__img" />
      <div className="pet-card__body">
        <h3>{pet.name}</h3>
        <p className="muted small">
          {SPECIES[pet.species]}{pet.sex && ` · ${SEX[pet.sex]}`} · {pet.isMixed ? 'SRD' : pet.breed}
          {pet.size && ` · ${PET_SIZES[pet.size].split(' (')[0]}`}
        </p>
        {pet.birthDate && (
          <p className="small">
            🎂 {formatDate(pet.birthDate)}{pet.birthDateEstimated && ' (aprox.)'} · {age}
          </p>
        )}
        {(pet.weightKg || pet.neckCm) && (
          <p className="small">
            {pet.weightKg && `${String(pet.weightKg).replace('.', ',')} kg`}
            {pet.weightKg && pet.neckCm && ' · '}
            {pet.neckCm && `pescoço ${String(pet.neckCm).replace('.', ',')} cm`}
          </p>
        )}
        {collar && <p className="tag tag--blue">Tamanho sugerido: {collar}</p>}
        {pet.notes && <p className="small muted">{pet.notes}</p>}
        {children}
      </div>
    </div>
  );
}

export default function Pets() {
  const [pets, setPets] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | pet
  const [error, setError] = useState('');

  useEffect(() => {
    api.pets().then(setPets).catch((e) => setError(e.message));
  }, []);

  const saved = (pet) => {
    setPets((list) => (list.some((p) => p.id === pet.id) ? list.map((p) => (p.id === pet.id ? pet : p)) : [...list, pet]));
    setEditing(null);
  };

  const remove = async (pet) => {
    if (!confirm(`Remover ${pet.name}?`)) return;
    await api.deletePet(pet.id);
    setPets((list) => list.filter((p) => p.id !== pet.id));
  };

  if (error) return <p className="alert">{error}</p>;
  if (!pets) return <p className="muted">Carregando…</p>;

  if (editing) {
    return <PetForm pet={editing === 'new' ? null : editing} onSaved={saved} onCancel={() => setEditing(null)} />;
  }

  return (
    <div className="stack">
      {pets.length === 0 && (
        <p className="muted">Conte pra gente quem é o seu melhor amigo — assim sugerimos o tamanho certo e mandamos um mimo no aniversário dele!</p>
      )}
      <div className="pets">
        {pets.map((p) => (
          <PetCard key={p.id} pet={p}>
            <div className="row">
              <button className="link" onClick={() => setEditing(p)}>Editar</button>
              <button className="link link--danger" onClick={() => remove(p)}>Remover</button>
            </div>
          </PetCard>
        ))}
      </div>
      <div><button className="btn btn--primary" onClick={() => setEditing('new')}>+ Cadastrar pet</button></div>
    </div>
  );
}
