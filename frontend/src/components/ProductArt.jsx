import { useId } from 'react';
import { imageUrl } from '../assets';

// Cute illustrated placeholders for products, drawn in the product's colour.
// Replace with real photos later by adding an `image` field to the product.
function PatternDef({ id, color, pattern }) {
  return (
    <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill={color} />
      {pattern === 'dots' && (
        <>
          <circle cx="6" cy="6" r="3" fill="#fff" opacity=".85" />
          <circle cx="18" cy="18" r="3" fill="#fff" opacity=".85" />
        </>
      )}
      {pattern === 'stripes' && <rect width="24" height="8" fill="#fff" opacity=".6" />}
      {pattern === 'hearts' && (
        <path
          d="M12 17.5s-6-3.6-6-7.4A3.2 3.2 0 0 1 12 8a3.2 3.2 0 0 1 6 2.1c0 3.8-6 7.4-6 7.4z"
          fill="#fff"
          opacity=".85"
        />
      )}
    </pattern>
  );
}

export default function ProductArt({ category, color = '#E8432A', pattern = 'plain', image, alt = '' }) {
  const id = useId().replace(/:/g, '');
  if (image) return <img src={imageUrl(image)} alt={alt} className="product-img" />;
  const fill = `url(#p${id})`;

  return (
    <svg viewBox="0 0 200 200" className="product-art" role="img" aria-label={alt}>
      <defs>
        <PatternDef id={`p${id}`} color={color} pattern={pattern} />
      </defs>

      {category === 'coleiras' && (
        <g>
          <ellipse cx="100" cy="92" rx="62" ry="40" fill="none" stroke="#00000014" strokeWidth="26" transform="translate(0 6)" />
          <ellipse cx="100" cy="92" rx="62" ry="40" fill="none" stroke={fill} strokeWidth="24" />
          <rect x="146" y="78" width="26" height="30" rx="7" fill="#FBE3F1" stroke="#1f1f3a" strokeOpacity=".15" strokeWidth="3" />
          <rect x="154" y="86" width="10" height="14" rx="3" fill={color} />
          <circle cx="100" cy="138" r="8" fill="none" stroke="#C9CCD8" strokeWidth="5" />
          {/* bone tag */}
          <g transform="translate(100 162)">
            <rect x="-18" y="-7" width="36" height="14" rx="7" fill="#FFD84D" />
            <circle cx="-18" cy="-6" r="7" fill="#FFD84D" />
            <circle cx="-18" cy="6" r="7" fill="#FFD84D" />
            <circle cx="18" cy="-6" r="7" fill="#FFD84D" />
            <circle cx="18" cy="6" r="7" fill="#FFD84D" />
          </g>
        </g>
      )}

      {category === 'bandanas' && (
        <g>
          <path d="M34 62 Q100 76 166 62 L104 166 Q100 172 96 166 Z" fill="#00000012" transform="translate(0 6)" />
          <path d="M34 62 Q100 76 166 62 L104 166 Q100 172 96 166 Z" fill={fill} />
          <path d="M28 50 Q100 70 172 50 L172 64 Q100 84 28 64 Z" fill={color} />
          <path d="M28 50 Q100 70 172 50 L172 64 Q100 84 28 64 Z" fill="#fff" opacity=".25" />
          <circle cx="28" cy="57" r="9" fill={color} />
          <circle cx="172" cy="57" r="9" fill={color} />
        </g>
      )}

      {category === 'presilhas' && (
        <g transform="translate(0 6)">
          <rect x="60" y="138" width="80" height="10" rx="5" fill="#C9CCD8" />
          <path d="M100 96 C70 60 30 62 34 98 C38 134 74 128 100 104 Z" fill={fill} />
          <path d="M100 96 C130 60 170 62 166 98 C162 134 126 128 100 104 Z" fill={fill} />
          <path d="M92 104 L78 150 L92 146 L98 156 Z" fill={color} />
          <path d="M108 104 L122 150 L108 146 L102 156 Z" fill={color} />
          <rect x="88" y="86" width="24" height="28" rx="10" fill={color} />
          <rect x="88" y="86" width="24" height="28" rx="10" fill="#fff" opacity=".3" />
        </g>
      )}
    </svg>
  );
}
