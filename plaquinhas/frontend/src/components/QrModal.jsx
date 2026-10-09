import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Close, Nfc, Copy, Check, Download, QrCode as QrIcon } from './Icons';
import { tagUrl, siteUrlConfigured } from '../brand';
import { pop } from '../motion';

// O que a loja precisa para gravar a medalha física: a imagem do QR Code para imprimir
// e a URL em texto para escrever na tag NFC com um aplicativo de gravação.
export default function QrModal({ code, onClose }) {
  const [png, setPng] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const url = tagUrl(code);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: '#2b2140', light: '#ffffff' } })
      .then((d) => alive && setPng(d))
      .catch(() => alive && setError('Não foi possível gerar o QR Code.'));
    return () => {
      alive = false;
    };
  }, [url]);

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('O navegador bloqueou a cópia. Selecione o endereço e copie à mão.');
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal__dialog" role="dialog" aria-modal="true" aria-label={`Gravação da medalha ${code}`} {...pop}>
        <div className="modal__head">
          <h2>Gravar a medalha</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <Close />
          </button>
        </div>

        <div className="modal__body">
          {!siteUrlConfigured && (
            <p className="notice">
              ⚠️ O endereço do site ainda não foi configurado, então este código aponta para{' '}
              <b>{location.origin}</b>. Defina <code className="mono">siteUrl</code> em{' '}
              <code className="mono">brand.config.json</code> antes de gravar medalhas de verdade.
            </p>
          )}

          <div className="qr">
            <p className="qr__code mono">{code}</p>
            <div className="qr__frame">
              {png ? (
                <img src={png} alt={`QR Code da plaquinha ${code}`} />
              ) : (
                <div className="spinner" style={{ margin: '77px auto' }} />
              )}
            </div>
            <small className="muted">Imprima ou grave este QR Code no verso da medalha.</small>
          </div>

          <div className="nfc">
            <span className="nfc__label">
              <Nfc width={18} height={18} /> Endereço para gravar na tag NFC
            </span>
            <p className="nfc__url mono">{url}</p>
            <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>
              {copied ? (
                <>
                  <Check width={16} height={16} /> Copiado!
                </>
              ) : (
                <>
                  <Copy width={16} height={16} /> Copiar endereço
                </>
              )}
            </button>
          </div>

          {error && <p className="alert">{error}</p>}
        </div>

        <div className="modal__foot">
          {png && (
            <a className="btn btn--primary btn--sm btn--grow" href={png} download={`qrcode-${code}.png`}>
              <Download width={18} height={18} /> Baixar QR
            </a>
          )}
          <a className="btn btn--ghost btn--sm btn--grow" href={`/tag/${code}`} target="_blank" rel="noreferrer">
            <QrIcon width={18} height={18} /> Ver a ficha
          </a>
        </div>
      </motion.div>
    </div>
  );
}
