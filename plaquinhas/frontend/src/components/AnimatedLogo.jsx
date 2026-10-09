import { useEffect, useState } from 'react';
import brand from '../brand';
import { imageUrl } from '../assets';

// Logo do cabeçalho com vida: a bola azul quica sem parar, o cachorro pisca de vez em quando e,
// a cada poucos segundos, late para a bola. O cachorro é a imagem do logo intacta — a bola e os
// olhos são camadas separadas recortadas da mesma figura (somadas, dão o pixel original de volta),
// e os riscos do latido são desenhados ao lado do focinho, no vermelho do próprio logo.
// As posições vêm de brand.config.json → assets.logoAnimated (porcentagens da imagem).
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function AnimatedLogo({ config }) {
  const [bark, setBark] = useState(null); // null | 'au!' | 'au au!'
  const [blink, setBlink] = useState(0); // incrementa a cada piscada (reinicia a animação CSS)
  const [ballX, ballY, ballW, ballH] = config.ballBox;
  const [barkX, barkY, barkW, barkH] = config.barkBox;

  // o cachorro fica quieto e, de vez em quando, late para a bola
  useEffect(() => {
    if (reducedMotion()) return;
    let t;
    const schedule = () => {
      t = setTimeout(() => {
        if (!document.hidden) {
          setBark(Math.random() < 0.35 ? 'au au!' : 'au!');
          t = setTimeout(() => { setBark(null); schedule(); }, 1100);
        } else schedule();
      }, 3500 + Math.random() * 4500);
    };
    schedule();
    return () => clearTimeout(t);
  }, []);

  // pisca a cada 2,5–6 s, às vezes duas vezes seguidas
  useEffect(() => {
    if (reducedMotion() || !config.eyes?.length) return;
    let t;
    const schedule = () => {
      t = setTimeout(() => {
        if (!document.hidden) {
          setBlink((b) => b + 1);
          if (Math.random() < 0.25) t = setTimeout(() => { setBlink((b) => b + 1); schedule(); }, 320);
          else schedule();
        } else schedule();
      }, 2500 + Math.random() * 3500);
    };
    schedule();
    return () => clearTimeout(t);
  }, [config.eyes]);

  return (
    <span className={`logo-anim ${bark ? 'logo-anim--bark' : ''}`}>
      <img src={imageUrl(config.base)} alt={brand.name} className="logo-img" />
      {config.eyes?.map(({ src, box: [x, y, w, h] }) => (
        <span key={src} className="logo-anim__eye" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }} aria-hidden>
          <img key={blink} src={imageUrl(src)} alt="" className={blink ? 'is-blinking' : ''} />
        </span>
      ))}
      <span className="logo-anim__ball" style={{ left: `${ballX}%`, top: `${ballY}%`, width: `${ballW}%`, height: `${ballH}%` }} aria-hidden>
        <img src={imageUrl(config.ball)} alt="" />
      </span>
      <span className="logo-anim__bark" style={{ left: `${barkX}%`, top: `${barkY}%`, width: `${barkW}%`, height: `${barkH}%` }} aria-hidden>
        <svg viewBox="0 0 60 56">
          <path d="M6 24 L20 10" />
          <path d="M9 36 L28 31" />
          <path d="M8 48 L24 52" />
        </svg>
        {bark && <span className="logo-anim__au" key={bark + Date.now()}>{bark}</span>}
      </span>
    </span>
  );
}
