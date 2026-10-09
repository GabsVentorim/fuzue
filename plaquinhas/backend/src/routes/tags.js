import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import db, { toPublicTag } from '../db.js';
import { normalizeCode } from '../util.js';

const router = Router();

// A plaquinha expõe o telefone do tutor, e o código é curto o bastante para ser varrido
// por força bruta. O teto por IP torna essa varredura inviável sem atrapalhar quem
// realmente achou um pet e escaneou a medalha.
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas consultas em pouco tempo. Espere alguns minutos.' },
});

const byCode = db.prepare('SELECT * FROM tags WHERE code = ?');
const countScan = db.prepare(
  "UPDATE tags SET scan_count = scan_count + 1, last_scan_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?"
);

router.get('/:code', limiter, (req, res) => {
  const row = byCode.get(normalizeCode(req.params.code));

  // Uma plaquinha desativada responde igual a uma que não existe: quem devolveu a
  // medalha para a loja não quer que os dados antigos continuem no ar.
  if (!row || row.status === 'inativo')
    return res.status(404).json({ error: 'Plaquinha não encontrada ou desativada.' });

  countScan.run(row.id);
  res.json(toPublicTag(row));
});

export default router;
