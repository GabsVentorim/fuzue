import { Router } from 'express';
import db, { toTag } from '../db.js';
import { requireAdmin } from '../auth.js';
import { imageUpload, publicPath, removeUpload } from '../uploads.js';
import {
  SPECIES, SEXES, SIZES, TAG_STATUSES,
  normalize, normalizeCode, isValidCode, randomCode,
  cleanPhone, toWhatsapp, isValidPhone,
  readBrand,
} from '../util.js';

const router = Router();
router.use(requireAdmin);

const brand = readBrand();
const PREFIX = brand.tag?.prefix || 'CR-';
const CODE_LENGTH = brand.tag?.codeLength || 5;

const getTag = (id) => db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
const codeTaken = db.prepare('SELECT 1 FROM tags WHERE code = ? AND id IS NOT ?');

// Lê e valida o corpo da requisição. Devolve as colunas já no formato do banco.
function readTag(body) {
  const t = {
    code: normalizeCode(body?.code),
    pet_name: String(body?.petName || '').trim(),
    species: body?.species,
    sex: body?.sex || null,
    breed: String(body?.breed || '').trim() || null,
    is_mixed: body?.isMixed ? 1 : 0,
    size: body?.size || null,
    notes: String(body?.notes || '').trim().slice(0, 1000) || null,
    tutor_name: String(body?.tutorName || '').trim(),
    tutor_neighborhood: String(body?.tutorNeighborhood || '').trim(),
    tutor_whatsapp: toWhatsapp(body?.tutorWhatsapp),
    tutor_phone: cleanPhone(body?.tutorPhone) || null,
    status: body?.status || 'ativo',
  };
  // Vira-lata não tem raça; o porte é o que descreve o pet.
  if (t.is_mixed) t.breed = null;
  // Sem telefone fixo informado, ligar cai no mesmo número do WhatsApp.
  if (!t.tutor_phone) t.tutor_phone = t.tutor_whatsapp || null;

  const errors = [];
  if (!isValidCode(t.code, PREFIX))
    errors.push(`Código inválido. Use o formato ${PREFIX}XXXXX — letras e números, sem espaços.`);
  if (!t.pet_name) errors.push('Informe o nome do pet.');
  if (!SPECIES.includes(t.species)) errors.push('Escolha a espécie do pet.');
  if (t.sex && !SEXES.includes(t.sex)) errors.push('Sexo inválido.');
  if (t.size && !SIZES.includes(t.size)) errors.push('Porte inválido.');
  if (t.is_mixed && !t.size) errors.push('Para vira-lata (SRD), informe o porte.');
  if (!t.is_mixed && !t.breed) errors.push('Informe a raça ou marque vira-lata (SRD).');
  if (!t.tutor_name) errors.push('Informe o nome do tutor.');
  if (!t.tutor_neighborhood) errors.push('Informe o bairro — é o que ajuda no reencontro local.');
  if (!isValidPhone(t.tutor_whatsapp)) errors.push('WhatsApp do tutor inválido. Informe DDD + número.');
  if (!TAG_STATUSES.includes(t.status)) errors.push('Status inválido.');

  return { t, error: errors.join(' ') || null };
}

// ---------- visão geral ----------
router.get('/dashboard', (_req, res) => {
  const count = (where = '') => db.prepare(`SELECT COUNT(*) AS n FROM tags ${where}`).get().n;
  res.json({
    total: count(),
    ativas: count("WHERE status = 'ativo'"),
    perdidos: count("WHERE status = 'perdido'"),
    inativas: count("WHERE status = 'inativo'"),
    escaneamentos: db.prepare('SELECT COALESCE(SUM(scan_count), 0) AS n FROM tags').get().n,
    perdidosAgora: db
      .prepare("SELECT * FROM tags WHERE status = 'perdido' ORDER BY updated_at DESC, id DESC LIMIT 5")
      .all()
      .map(toTag),
    ultimas: db.prepare('SELECT * FROM tags ORDER BY id DESC LIMIT 5').all().map(toTag),
  });
});

// ---------- lista ----------
router.get('/tags', (req, res) => {
  const rows = db.prepare('SELECT * FROM tags ORDER BY id DESC').all().map(toTag);
  const status = req.query.status;
  const q = normalize(req.query.q);

  const filtered = rows
    .filter((t) => !status || t.status === status)
    .filter((t) =>
      !q ||
      [t.code, t.petName, t.tutorName, t.tutorNeighborhood, t.breed].some((f) => normalize(f).includes(q))
    );

  res.json(filtered);
});

// Sugere um código livre para a próxima plaquinha.
router.get('/tags/next-code', (_req, res) => {
  for (let i = 0; i < 50; i++) {
    const code = randomCode(PREFIX, CODE_LENGTH);
    if (!codeTaken.get(code, null)) return res.json({ code });
  }
  res.status(500).json({ error: 'Não foi possível gerar um código livre. Tente de novo.' });
});

router.get('/tags/:id', (req, res) => {
  const row = getTag(req.params.id);
  if (!row) return res.status(404).json({ error: 'Plaquinha não encontrada.' });
  res.json(toTag(row));
});

// ---------- criar ----------
router.post('/tags', (req, res) => {
  const { t, error } = readTag(req.body);
  if (error) return res.status(400).json({ error });
  if (codeTaken.get(t.code, null)) return res.status(409).json({ error: `O código ${t.code} já está em uso.` });

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO tags (code, pet_name, species, sex, breed, is_mixed, size, notes,
      tutor_name, tutor_neighborhood, tutor_phone, tutor_whatsapp, status, created_by)
    VALUES (@code, @pet_name, @species, @sex, @breed, @is_mixed, @size, @notes,
      @tutor_name, @tutor_neighborhood, @tutor_phone, @tutor_whatsapp, @status, @created_by)
  `).run({ ...t, created_by: req.user.id });

  res.status(201).json(toTag(getTag(lastInsertRowid)));
});

// ---------- editar ----------
router.put('/tags/:id', (req, res) => {
  const current = getTag(req.params.id);
  if (!current) return res.status(404).json({ error: 'Plaquinha não encontrada.' });

  const { t, error } = readTag(req.body);
  if (error) return res.status(400).json({ error });
  if (codeTaken.get(t.code, current.id)) return res.status(409).json({ error: `O código ${t.code} já está em uso.` });

  db.prepare(`
    UPDATE tags SET code=@code, pet_name=@pet_name, species=@species, sex=@sex, breed=@breed,
      is_mixed=@is_mixed, size=@size, notes=@notes, tutor_name=@tutor_name,
      tutor_neighborhood=@tutor_neighborhood, tutor_phone=@tutor_phone, tutor_whatsapp=@tutor_whatsapp,
      status=@status, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id=@id
  `).run({ ...t, id: current.id });

  res.json(toTag(getTag(current.id)));
});

// Atalho do painel: marcar como perdido / achado sem abrir o formulário inteiro.
router.patch('/tags/:id/status', (req, res) => {
  const current = getTag(req.params.id);
  if (!current) return res.status(404).json({ error: 'Plaquinha não encontrada.' });

  const status = req.body?.status;
  if (!TAG_STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido.' });

  db.prepare("UPDATE tags SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
    .run(status, current.id);

  res.json(toTag(getTag(current.id)));
});

// ---------- excluir ----------
router.delete('/tags/:id', (req, res) => {
  const tag = getTag(req.params.id);
  if (!tag) return res.status(404).json({ error: 'Plaquinha não encontrada.' });
  db.prepare('DELETE FROM tags WHERE id = ?').run(tag.id);
  removeUpload(tag.photo_url);
  res.json({ ok: true });
});

// ---------- foto do pet ----------
const upload = imageUpload('pets');

router.post('/tags/:id/photo', (req, res) => {
  const tag = getTag(req.params.id);
  if (!tag) return res.status(404).json({ error: 'Plaquinha não encontrada.' });
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    const url = publicPath('pets', req.file);
    db.prepare('UPDATE tags SET photo_url = ? WHERE id = ?').run(url, tag.id);
    removeUpload(tag.photo_url);
    res.json(toTag(getTag(tag.id)));
  });
});

router.delete('/tags/:id/photo', (req, res) => {
  const tag = getTag(req.params.id);
  if (!tag) return res.status(404).json({ error: 'Plaquinha não encontrada.' });
  db.prepare('UPDATE tags SET photo_url = NULL WHERE id = ?').run(tag.id);
  removeUpload(tag.photo_url);
  res.json(toTag(getTag(tag.id)));
});

export default router;
