import { useState } from 'react';
import { imageUrl } from '../assets';

const initials = (name = '') =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// Profile photo (uploaded or from Google). Falls back to the person's initials.
export default function Avatar({ user, size = 40, className = '' }) {
  const src = imageUrl(user?.avatarUrl);
  const [failed, setFailed] = useState(null);
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (src && failed !== src) {
    return (
      <img
        src={src}
        alt=""
        className={`avatar ${className}`}
        style={style}
        referrerPolicy="no-referrer"
        onError={() => setFailed(src)}
      />
    );
  }
  return (
    <span className={`avatar avatar--initials ${className}`} style={style} aria-hidden>
      {initials(user?.name)}
    </span>
  );
}
