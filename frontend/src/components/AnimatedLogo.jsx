import { useEffect, useState } from 'react';
import brand from '../brand';
import { imageUrl } from '../assets';

// Header logo with life: the blue ball bounces non-stop, the dog blinks now and then and, every few
// seconds, barks at the ball. The dog is the untouched logo image — the ball and the eyes are separate
// layers cut from the same picture (they add back up to the original pixel for pixel), and the bark
// marks are drawn next to the snout in the logo's own red.
// Positions come from brand.config.json → assets.logoAnimated (percentages of the logo image).
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function AnimatedLogo({ config }) {
  const [bark, setBark] = useState(null); // null | 'au!' | 'au au!'
  const [blink, setBlink] = useState(0); // bumps on every blink (restarts the CSS animation)
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

  // blinks every 2.5–6 s, sometimes twice in a row
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
