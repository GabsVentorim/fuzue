import useReveal from '../hooks/useReveal';
import MaterialIcon from './MaterialIcon';
import Stickers from './Stickers';

// A braided strand in the product's chosen colour, endlessly being woven (shown for corded products).
function Braid({ color }) {
  const strand = 'M0 20 C 15 0, 35 0, 50 20 S 85 40, 100 20';
  return (
    <svg className="braid" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden>
      <defs>
        <pattern id="braid-a" width="100" height="40" patternUnits="userSpaceOnUse">
          <path d={strand} className="braid__strand" style={{ stroke: color }} />
        </pattern>
        <pattern id="braid-b" width="100" height="40" patternUnits="userSpaceOnUse" x="50">
          <path d={strand} className="braid__strand braid__strand--b" />
        </pattern>
      </defs>
      <rect className="braid__track braid__track--a" width="800" height="40" fill="url(#braid-a)" />
      <rect className="braid__track braid__track--b" width="800" height="40" fill="url(#braid-b)" />
    </svg>
  );
}

// "Do que é feito": the materials and details registered in Admin → Produtos.
export default function ProductMaterials({ details, color }) {
  const [ref, shown] = useReveal({ threshold: 0.15 });
  if (!details?.length) return null;
  const braided = details.some((d) => d.icon === 'cord');
  return (
    <section className={`materials ${shown ? 'is-in' : ''}`} ref={ref} aria-labelledby="materials-title">
      <Stickers items={[
        { kind: 'flower', color: '#f7b6d9', faced: true, wink: true, size: 'clamp(54px, 7vw, 76px)', top: '-6px', right: '2%', rot: 10 },
        { kind: 'sparkle', color: '#ff2a0a', size: 38, top: '8px', left: 'clamp(250px, 46%, 560px)', hideMobile: true },
      ]} />
      <div className="materials__head">
        <h2 id="materials-title" className="materials__title">Do que é feito</h2>
        {braided && <Braid color={color || 'var(--blue)'} />}
      </div>
      <ul className="materials__list">
        {details.map((d, i) => (
          <li key={i} className={`mat mat--${d.icon}`} style={{ '--i': i }}>
            <span className="mat__icon"><MaterialIcon name={d.icon} /></span>
            <b className="mat__title">{d.title}</b>
            {d.text && <p className="mat__text">{d.text}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
