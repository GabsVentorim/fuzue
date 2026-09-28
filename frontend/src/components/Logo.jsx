import brand from '../brand';
import { asset } from '../assets';

// Logo images come from brand.config.json → assets.logo / assets.logoLight (light = for dark backgrounds).
// When not set, a text logo is built from the store name.
export default function Logo({ variant = 'default' }) {
  const src = (variant === 'light' && asset('logoLight')) || asset('logo');
  if (src) {
    return <img src={src} alt={brand.name} className="logo-img" />;
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
