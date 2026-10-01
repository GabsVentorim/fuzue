import { useEffect, useState } from 'react';
import brand from '../brand';
import { imageUrl } from '../assets';

// Header logo with life: the blue ball bounces non-stop and, every few seconds, the dog barks at it.
// The dog itself is the untouched logo image — only the ball is a separate layer (cut from the same
// picture) and the bark marks are drawn next to the snout in the logo's own red.
// Positions come from brand.config.json → assets.logoAnimated (percentages of the logo image).
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function AnimatedLogo({ config }) {
  const [bark, setBark] = useState(null); // null | 'au!' | 'au au!'
  const [ballX, ballY, ballW, ballH] = config.ballBox;
  const [barkX, barkY, barkW, barkH] = config.barkBox;

  // the dog stays still and, now and then, barks at the ball
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

  return (
    <span className={`logo-anim ${bark ? 'logo-anim--bark' : ''}`}>
      <img src={imageUrl(config.base)} alt={brand.name} className="logo-img" />
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
