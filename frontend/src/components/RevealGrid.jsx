import useReveal from '../hooks/useReveal';

// A product grid whose cards arrive one after another the first time it scrolls into view.
export default function RevealGrid({ children, className = '' }) {
  const [ref, shown] = useReveal({ threshold: 0.05 });
  return (
    <div className={`grid grid--stagger ${className} ${shown ? 'is-in' : ''}`} ref={ref}>
      {[].concat(children).map((child, i) => (
        <div key={child?.key ?? i} style={{ '--i': i }}>{child}</div>
      ))}
    </div>
  );
}
