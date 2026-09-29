import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SIZES, BREED_NECKS, PORTE_NECKS, sizeForNeck, sizesForRange } from '../sizes';

const MODES = [
  { id: 'raca', label: 'Pela raça' },
  { id: 'porte', label: 'Vira-lata / sem raça' },
  { id: 'medida', label: 'Já medi' },
];

const STEPS = [
  ['Pegue uma fita métrica', <>De costureira serve. Não tem? <Link to="/fita-metrica" className="link">Imprima a nossa</Link> ou use um barbante e meça numa régua depois.</>],
  ['Encontre o lugar certo', 'Meça na parte do meio do pescoço, onde a coleira fica naturalmente — nem colado na cabeça, nem nos ombros.'],
  ['Deixe dois dedinhos de folga', 'Passe a fita em volta e coloque dois dedos entre a fita e o pescoço. A coleira não pode apertar nem sair pela cabeça.'],
  ['Anote e compare', 'Veja o número em centímetros e compare com a tabela. Ficou entre dois tamanhos? Escolha o maior.'],
];

function Result({ min, max, exact }) {
  const sizes = exact != null ? [sizeForNeck(exact)?.id].filter(Boolean) : sizesForRange(min, max);
  if (!sizes.length) {
    return (
      <div className="finder__result">
        <p><b>Essa medida está fora da nossa tabela.</b> Fale com a gente no WhatsApp que ajudamos a achar a melhor opção.</p>
      </div>
    );
  }
  const range = exact != null ? `${String(exact).replace('.', ',')} cm` : `${min}–${max} cm`;
  return (
    <div className="finder__result">
      <span className="finder__label">Tamanho indicado</span>
      <strong className="finder__size">{sizes.join(' ou ')}</strong>
      <p className="small">
        {exact != null ? `Pescoço de ${range}.` : `Pescoço típico de um adulto: ${range}.`}
        {sizes.length > 1 && ' Fica entre dois tamanhos — meça para ter certeza (na dúvida, escolha o maior).'}
        {exact == null && sizes.length === 1 && ' Cada pet é único: vale medir para confirmar.'}
      </p>
      <Link to="/loja?categoria=coleiras" className="btn btn--primary btn--sm">Ver coleiras</Link>
    </div>
  );
}

export default function SizeGuide() {
  const [mode, setMode] = useState('raca');
  const [breed, setBreed] = useState('');
  const [porte, setPorte] = useState('');
  const [neck, setNeck] = useState('');

  const breedInfo = BREED_NECKS.find((b) => b.name === breed);
  const porteInfo = PORTE_NECKS[porte];
  const neckNum = Number(String(neck).replace(',', '.'));

  return (
    <div className="size-guide">
      <div className="sizes-box">
        <div>
          <h2>Qual tamanho escolher?</h2>
          <p>Meça o pescoço do seu pet e deixe espaço para dois dedinhos. Não tem fita métrica? Imprima a nossa!</p>
          <Link to="/fita-metrica" className="btn btn--light btn--sm">Imprimir fita métrica</Link>
        </div>
        <ul className="sizes-list">
          {SIZES.map((s) => (
            <li key={s.id}><b>{s.id}</b> <span className="nowrap">{s.min}–{s.max} cm</span> <small>{s.hint}</small></li>
          ))}
        </ul>
      </div>

      <div className="size-guide__grid">
        <div className="panel finder">
          <h3>Descubra o tamanho do seu pet</h3>
          <div className="chips" role="tablist">
            {MODES.map((m) => (
              <button key={m.id} type="button" role="tab" aria-selected={mode === m.id}
                className={`chip ${mode === m.id ? 'chip--on' : ''}`} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'raca' && (
            <>
              <label className="field">
                Raça do cachorro
                <select className="input" value={breed} onChange={(e) => setBreed(e.target.value)}>
                  <option value="">Escolha a raça</option>
                  {BREED_NECKS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </label>
              <p className="small muted">
                Não achou a raça? <button type="button" className="link" onClick={() => setMode('porte')}>Escolha pelo porte</button>.
              </p>
              {breedInfo && <Result min={breedInfo.min} max={breedInfo.max} />}
            </>
          )}

          {mode === 'porte' && (
            <>
              <div className="field">
                <span>Porte do cachorro (adulto)</span>
                <div className="porte-opts">
                  {Object.entries(PORTE_NECKS).map(([k, p]) => (
                    <button key={k} type="button" className={`chip ${porte === k ? 'chip--on' : ''}`} onClick={() => setPorte(k)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {porteInfo && <Result min={porteInfo.min} max={porteInfo.max} />}
            </>
          )}

          {mode === 'medida' && (
            <>
              <label className="field">
                Medida do pescoço (cm), já com os dois dedinhos de folga
                <input className="input" inputMode="decimal" placeholder="ex.: 34" value={neck} onChange={(e) => setNeck(e.target.value)} />
              </label>
              {neckNum > 0 && <Result exact={neckNum} />}
            </>
          )}
        </div>

        <div className="panel how-to">
          <h3>Como medir, passo a passo</h3>
          <ol className="steps">
            {STEPS.map(([title, text], i) => (
              <li key={i}>
                <span className="steps__n">{i + 1}</span>
                <div><b>{title}</b><p className="small">{text}</p></div>
              </li>
            ))}
          </ol>
          <Link to="/fita-metrica" className="btn btn--ghost btn--sm">Baixar / imprimir fita métrica</Link>
        </div>
      </div>
    </div>
  );
}
