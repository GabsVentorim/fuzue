import { useState } from 'react';
import brand from '../brand';
import { asset } from '../assets';
import AnimatedLogo from './AnimatedLogo';

// Logo images come from brand.config.json → assets.logo / assets.logoLight (light = for dark backgrounds).
// When not set — or the file is missing — a text logo is built from the store name.
export default function Logo({ variant = 'default' }) {
  const [failed, setFailed] = useState([]);
  // header only: the animated version (bouncing ball + barking dog), when configured
  const animated = brand.assets?.logoAnimated;
  if (variant === 'default' && animated?.base && !failed.includes('animated')) return <AnimatedLogo config={animated} />;
  const src = [variant === 'light' && asset('logoLight'), asset('logo')].find((s) => s && !failed.includes(s));
  if (src) {
    return <img src={src} alt={brand.name} className={`logo-img logo-img--${variant}`} onError={() => setFailed((f) => [...f, src])} />;
  }
  return (
    <span className={`logo logo--${variant}`}>
      <span className="logo__name">
        {brand.name}
        <span className="logo__dot" />
      </span>
      <span className="logo__sub">{brand.subtitle}</span>
    </span>
  );
}
