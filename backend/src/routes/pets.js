import { Router } from 'express';
import db, { toPet } from '../db.js';
import { requireAuth } from '../auth.js';
import { imageUpload, publicPath, removeUpload } from '../uploads.js';

const router = Router();
router.use(requireAuth);

const SPECIES = ['cachorro', 'gato'];
const SEXES = ['macho', 'femea'];
const SIZES = ['mini', 'pequeno', 'medio', 'grande', 'gigante'];

const num = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : NaN;
};

function readPet(body) {
  const p = {
    name: String(body?.name || '').trim(),
    species: body?.species,
    sex: body?.sex || null,
    birth_date: body?.birthDate || null,
    birth_date_estimated: body?.birthDateEstimated ? 1 : 0,
    is_mixed: body?.isMixed ? 1 : 0,
    breed: String(body?.breed || '').trim() || null,
    size: body?.size || null,
    weight_kg: num(body?.weightKg),
    neck_cm: num(body?.neckCm),
    coat_color: String(body?.coatColor || '').trim() || null,
    neutered: body?.neutered ? 1 : 0,
    notes: String(body?.notes || '').trim().slice(0, 1000) || null,
  };
  if (p.is_mixed) p.breed = null;

  const errors = [];
  if (!p.name) errors.push('Informe o nome do pet.');
  if (!SPECIES.includes(p.species)) errors.push('Escolha se é cachorro ou gato.');
  if (p.sex && !SEXES.includes(p.sex)) errors.push('Sexo inválido.');
  if (p.size && !SIZES.includes(p.size)) errors.push('Porte inválido.');
  if (p.is_mixed && !p.size) errors.push('Para vira-lata (SRD), informe o porte.');
  if (!p.is_mixed && !p.breed) errors.push('Informe a raça ou marque vira-lata (SRD).');
  if (p.birth_date) {
    const d = new Date(p.birth_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.birth_date) || isNaN(d) || d > new Date())
      errors.push('Data de nascimento inválida.');
  }
  if (Number.isNaN(p.weight_kg)) errors.push('Peso inválido.');
  if (Number.isNaN(p.neck_cm)) errors.push('Medida do pescoço inválida.');

  return { p, error: errors.join(' ') || null };
}

const getPet = (id, userId) => db.prepare('SELECT * FROM pets WHERE id = ? AND user_id = ?').get(id, userId);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM pets WHERE user_id = ? ORDER BY id').all(req.user.id).map(toPet));
});

router.post('/', (req, res) => {
  const { p, error } = readPet(req.body);
  if (error) return res.status(400).json({ error });
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO pets (user_id, name, species, sex, birth_date, birth_date_estimated, breed, is_mixed, size,
      weight_kg, neck_cm, coat_color, neutered, notes)
    VALUES (@user_id, @name, @species, @sex, @birth_date, @birth_date_estimated, @breed, @is_mixed, @size,
      @weight_kg, @neck_cm, @coat_color, @neutered, @notes)`).run({ ...p, user_id: req.user.id });
  res.status(201).json(toPet(getPet(lastInsertRowid, req.user.id)));
});

router.put('/:id', (req, res) => {
  if (!getPet(req.params.id, req.user.id)) return res.status(404).json({ error: 'Pet não encontrado.' });
  const { p, error } = readPet(req.body);
  if (error) return res.status(400).json({ error });
  db.prepare(`
    UPDATE pets SET name=@name, species=@species, sex=@sex, birth_date=@birth_date,
      birth_date_estimated=@birth_date_estimated, breed=@breed, is_mixed=@is_mixed, size=@size,
      weight_kg=@weight_kg, neck_cm=@neck_cm, coat_color=@coat_color, neutered=@neutered, notes=@notes
    WHERE id=@id AND user_id=@user_id`).run({ ...p, id: req.params.id, user_id: req.user.id });
  res.json(toPet(getPet(req.params.id, req.user.id)));
});

router.delete('/:id', (req, res) => {
  const pet = getPet(req.params.id, req.user.id);
  if (!pet) return res.status(404).json({ error: 'Pet não encontrado.' });
  db.prepare('DELETE FROM pets WHERE id = ?').run(pet.id);
  removeUpload(pet.photo_url);
  res.json({ ok: true });
});

const upload = imageUpload('pets');
router.post('/:id/photo', (req, res) => {
  const pet = getPet(req.params.id, req.user.id);
  if (!pet) return res.status(404).json({ error: 'Pet não encontrado.' });
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    const url = publicPath('pets', req.file);
    db.prepare('UPDATE pets SET photo_url = ? WHERE id = ?').run(url, pet.id);
    removeUpload(pet.photo_url);
    res.json(toPet(getPet(pet.id, req.user.id)));
  });
});

export default router;
