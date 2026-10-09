import { useEffect } from 'react';
import { motion } from 'framer-motion';
import TagCard from './TagCard';
import { Close } from './Icons';
import { pop } from '../motion';

// Mostra como a ficha fica para quem escaneia a medalha. É o mesmo TagCard da página
// pública, dentro de uma moldura de celular — é assim que praticamente todo mundo vai ver.
//
// A prévia usa os dados do formulário, não os salvos: dá para conferir uma alteração
// antes de gravá-la.
export default function PreviewModal({ tag, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal__dialog modal__dialog--preview"
        role="dialog"
        aria-modal="true"
        aria-label="Prévia da ficha do pet"
        {...pop}
      >
        <div className="modal__head">
          <h2>Prévia da ficha</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <Close />
          </button>
        </div>

        <div className="modal__body preview">
          <p className="muted small center" style={{ margin: 0 }}>
            É isto que aparece para quem encontrar o pet e escanear a medalha.
          </p>
          <div className="phone">
            <div className="phone__screen">
              <TagCard tag={tag} preview />
            </div>
          </div>
          <p className="muted small center" style={{ margin: 0 }}>
            Os botões estão desativados aqui — na ficha de verdade eles abrem o WhatsApp e a ligação.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
