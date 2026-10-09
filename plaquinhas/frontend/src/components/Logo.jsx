import { useState } from 'react';
import brand from '../brand';
import { asset } from '../assets';
import AnimatedLogo from './AnimatedLogo';

// As imagens do logo vêm de brand.config.json → assets.logo / assets.logoLight
// (light = para fundos escuros). Sem configuração — ou com arquivo faltando — monta
// um logo em texto a partir do nome da loja.
export default function Logo({ variant = 'default' }) {
  const [failed, setFailed] = useState([]);
  // Só no cabeçalho: a versão animada (bola quicando + cachorro latindo), quando configurada.
  const animated = brand.assets?.logoAnimated;
  if (variant === 'default' && animated?.base && !failed.includes('animated')) return <AnimatedLogo config={animated} />;

  const src = [variant === 'light' && asset('logoLight'), asset('logo')].find((s) => s && !failed.includes(s));

  if (src) {
    return (
      <img
        src={src}
        alt={brand.name}
        className={`logo-img logo-img--${variant}`}
        onError={() => setFailed((f) => [...f, src])}
      />
    );
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
