import { useState } from 'react';
import { Link } from 'react-router-dom';
import Mascot from './Mascot';
import { SIZES, BREED_NECKS, PORTE_NECKS, sizeForNeck, sizesForRange, sizeRange } from '../sizes';

const MODES = [
  { id: 'raca', label: 'Pela raça' },
  { id: 'porte', label: 'Vira-lata' },
  { id: 'medida', label: 'Já medi' },
];

const STEPS = [
  ['Pegue uma fita', 'De costureira, a nossa impressa ou um barbante + régua.'],
  ['Meça no meio do pescoço', 'Onde a coleira fica: nem colado na cabeça, nem nos ombros.'],
  ['Deixe 2 dedinhos de folga', 'A coleira não pode apertar nem sair pela cabeça.'],
  ['Compare com a tabela', 'Ficou entre dois tamanhos? Escolha o maior.'],
];

const fmt = (n) => String(n).replace('.', ',');

// Works out the recommended sizes (and the explanation) for the current finder input.
function useFinder() {
  const [mode, setMode] = useState('raca');
  const [breed, setBreed] = useState('');
  const [porte, setPorte] = useState('');
  const [neck, setNeck] = useState('');

  let result = null;
  if (mode === 'raca' && breed) {
    const b = BREED_NECKS.find((x) => x.name === breed);
    result = { sizes: sizesForRange(b.min, b.max), note: `Um ${b.name} adulto costuma ter ${b.min}–${b.max} cm de pescoço.` };
  } else if (mode === 'porte' && porte) {
    const p = PORTE_NECKS[porte];
    result = { sizes: sizesForRange(p.min, p.max), note: `Porte ${p.label.split(' (')[0].toLowerCase()}: pescoço costuma ter ${p.min}–${p.max} cm.` };
  } else if (mode === 'medida') {
    const cm = Number(String(neck).replace(',', '.'));
    if (cm > 0) {
      const s = sizeForNeck(cm);
      result = { sizes: s ? [s.id] : [], note: `Pescoço de ${fmt(cm)} cm.`, exact: true };
    }
  }
  return { mode, setMode, breed, setBreed, porte, setPorte, neck, setNeck, result };
}

export default function SizeGuide() {
  const f = useFinder();
  const picked = f.result?.sizes || [];

  return (
    <div className="sg">
      {/* 1 — how to measure */}
      <div className="sg__top">
        <div className="sg__intro">
          <Mascot className="sg__mascot" />
          <h2>Qual tamanho escolher?</h2>
          <p>Meça o pescoço do seu pet em 4 passos — ou descubra pela raça logo abaixo.</p>
          <Link to="/fita-metrica" className="btn btn--light btn--sm">📏 Imprimir fita métrica</Link>
        </div>
        <ol className="sg__steps">
          {STEPS.map(([title, text], i) => (
            <li key={i}>
              <span className="sg__n">{i + 1}</span>
              <b>{title}</b>
              <small>{text}</small>
            </li>
          ))}
        </ol>
      </div>

      <div className="sg__body">
        {/* 2 — finder */}
        <div className="sg__finder">
          <h3>Descubra o tamanho do seu pet</h3>
          <div className="seg sg__modes" role="tablist">
            {MODES.map((m) => (
              <button key={m.id} type="button" role="tab" aria-selected={f.mode === m.id}
                className={`seg__opt ${f.mode === m.id ? 'seg__opt--on' : ''}`} onClick={() => f.setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>

          {f.mode === 'raca' && (
            <label className="field">
              Raça do cachorro
              <select className="input" value={f.breed} onChange={(e) => f.setBreed(e.target.value)}>
                <option value="">Escolha a raça</option>
                {BREED_NECKS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
              <small className="muted">
                Não achou? <button type="button" className="link" onClick={() => f.setMode('porte')}>Escolha pelo porte</button>
              </small>
            </label>
          )}

          {f.mode === 'porte' && (
            <div className="field">
              <span>Porte do cachorro adulto</span>
              <div className="sg__portes">
                {Object.entries(PORTE_NECKS).map(([k, p]) => (
                  <button key={k} type="button" className={`sg__porte ${f.porte === k ? 'sg__porte--on' : ''}`} onClick={() => f.setPorte(k)}>
                    <b>{p.label.split(' (')[0]}</b>
                    <small>{p.label.match(/\((.*)\)/)?.[1]}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {f.mode === 'medida' && (
            <label className="field">
              Medida do pescoço, com os 2 dedinhos de folga
              <span className="sg__cm">
                <input className="input" inputMode="decimal" placeholder="ex.: 34" value={f.neck} onChange={(e) => f.setNeck(e.target.value)} />
                <span>cm</span>
              </span>
            </label>
          )}

          <div className={`sg__result ${f.result ? 'sg__result--on' : ''}`} aria-live="polite">
            {!f.result && <p className="muted small">Escolha uma opção acima e o tamanho indicado acende na tabela. 👉</p>}
            {f.result && picked.length > 0 && (
              <>
                <span className="sg__label">Tamanho indicado</span>
                <strong className="sg__size">{picked.join(' ou ')}</strong>
                <p className="small">
                  {f.result.note}
                  {picked.length > 1 ? ' Fica entre dois tamanhos — na dúvida, escolha o maior.' : !f.result.exact && ' Vale medir para confirmar.'}
                </p>
                <Link to="/loja?categoria=coleiras" className="btn btn--primary btn--sm">Ver coleiras</Link>
              </>
            )}
            {f.result && picked.length === 0 && (
              <p className="small"><b>Essa medida está fora da nossa tabela.</b> Fale com a gente no WhatsApp que ajudamos a achar a melhor opção.</p>
            )}
          </div>
        </div>

        {/* 3 — size table, highlights the recommendation */}
        <div className="sg__table">
          <h3>Tabela de tamanhos</h3>
          <ul>
            {SIZES.map((s) => (
              <li key={s.id} className={picked.includes(s.id) ? 'is-on' : picked.length ? 'is-dim' : ''}>
                <b>{s.id}</b>
                <span className="nowrap">{sizeRange(s)}</span>
                <small>{s.hint}</small>
              </li>
            ))}
          </ul>
          <p className="muted small">Medida do pescoço com 2 dedinhos de folga.</p>
        </div>
      </div>
    </div>
  );
}
