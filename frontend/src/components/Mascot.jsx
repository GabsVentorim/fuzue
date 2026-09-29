import { useState } from 'react';
import brand from '../brand';
import { asset } from '../assets';

// The brand mascot (brand.config.json → assets.mascot). Renders nothing when it isn't configured
// or the file is missing, so every spot that uses it falls back to the previous layout.
export default function Mascot({ className = '', width, decorative = true }) {
  const [failed, setFailed] = useState(false);
  const src = asset('mascot');
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt={decorative ? '' : `Mascote da ${brand.name}`}
      aria-hidden={decorative || undefined}
      className={`mascot ${className}`}
      style={width ? { width } : undefined}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
