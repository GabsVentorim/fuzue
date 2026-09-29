import { Link } from 'react-router-dom';
import brand from '../brand';

const STRIP_CM = 25;
const STRIPS = 3; // 0–75 cm, enough for every size up to GG

// One strip of the tape, drawn in real millimetres (1 SVG unit = 1 mm) so it prints at true size.
function Strip({ index }) {
  const start = index * STRIP_CM;
  const w = STRIP_CM * 10;
  const h = 26;
  const ticks = [];
  for (let mm = 0; mm <= w; mm++) {
    const cm = mm % 10 === 0;
    const half = mm % 5 === 0;
    ticks.push(<line key={mm} x1={mm} x2={mm} y1={0} y2={cm ? 10 : half ? 7 : 4} stroke="#2b2140" strokeWidth={cm ? 0.35 : 0.2} />);
    if (cm && mm < w) {
      ticks.push(
        <text key={`t${mm}`} x={mm + 0.8} y={15} fontSize="4" fontFamily="Arial, sans-serif" fill="#2b2140">
          {start + mm / 10}
        </text>
      );
    }
  }
  return (
    <div className="tape__strip">
      <span className="tape__tag">Tira {index + 1} · {start}–{start + STRIP_CM} cm {index > 0 && '— cole no fim da tira ' + index}</span>
      <svg width={`${w}mm`} height={`${h}mm`} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Fita métrica de ${start} a ${start + STRIP_CM} cm`}>
        <rect x="0" y="0" width={w} height={h} fill="#fff" stroke="#2b2140" strokeWidth="0.3" />
        {ticks}
        <text x={w - 2} y={h - 3} fontSize="3.2" textAnchor="end" fontFamily="Arial, sans-serif" fill="#E8432A">
          {brand.name} · fita para medir o pescoço do seu pet
        </text>
      </svg>
    </div>
  );
}

export default function TapeMeasure() {
  return (
    <section className="section container tape-page">
      {/* print only the tape, on A4 landscape, at 100% */}
      <style>{`@media print { @page { size: A4 landscape; margin: 12mm; } }`}</style>

      <div className="no-print">
        <p className="crumbs"><Link to="/guia-de-tamanhos">Guia de tamanhos</Link> / Fita métrica</p>
        <h1 className="page-title">Fita métrica para imprimir</h1>
        <div className="tape-help">
          <ol className="steps">
            <li><span className="steps__n">1</span><div><b>Imprima em tamanho real</b><p className="small">No diálogo de impressão, escolha papel <b>A4</b>, orientação <b>paisagem</b> e escala <b>100%</b> (“tamanho real” — desmarque “ajustar à página”). Para guardar, escolha “Salvar como PDF”.</p></div></li>
            <li><span className="steps__n">2</span><div><b>Confira a escala</b><p className="small">Coloque uma régua sobre a tira 1: do 0 ao 10 tem que dar exatamente 10 cm. Se não der, a impressão foi reduzida — ajuste a escala para 100%.</p></div></li>
            <li><span className="steps__n">3</span><div><b>Recorte e junte</b><p className="small">Recorte as 3 tiras e cole com fita adesiva, uma na ponta da outra (o 25 da tira 1 encosta no começo da tira 2), sem sobrepor.</p></div></li>
            <li><span className="steps__n">4</span><div><b>Meça</b><p className="small">Passe em volta do pescoço com dois dedinhos de folga e veja o número. Depois é só conferir no <Link to="/guia-de-tamanhos" className="link">guia de tamanhos</Link>.</p></div></li>
          </ol>
          <button className="btn btn--primary" onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
        </div>
      </div>

      <div className="tape">
        {Array.from({ length: STRIPS }, (_, i) => <Strip key={i} index={i} />)}
      </div>
    </section>
  );
}
