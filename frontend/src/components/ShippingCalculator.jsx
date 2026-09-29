import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { formatPrice } from '../brand';
import { Truck } from './Icons';

export const maskCep = (v) => String(v || '').replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
const days = ({ min, max }) => (min === max ? `${max}` : `${min} a ${max}`) + (max > 1 ? ' dias úteis' : ' dia útil');

// CEP box + list of shipping options from SuperFrete.
// `items`: [{ productId, qty }]. With `onSelect`, options become selectable (cart / checkout).
export default function ShippingCalculator({ items, cep: cepProp, onCepChange, selectedId, onSelect, onQuote, auto = false, compact = false, hideInput = false, limit = 0 }) {
  const [showAll, setShowAll] = useState(false);
  const [cep, setCep] = useState(maskCep(cepProp));
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const itemsKey = JSON.stringify(items.map((i) => [i.productId, i.qty]));
  const lastKey = useRef('');

  useEffect(() => setCep(maskCep(cepProp)), [cepProp]);

  const calc = async (value = cep) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 8) return setError('Digite um CEP com 8 números.');
    lastKey.current = digits + itemsKey;
    setLoading(true);
    setError('');
    try {
      const q = await api.shippingQuote(digits, items);
      setQuote(q);
      setShowAll(false);
      onQuote?.(q);
    } catch (err) {
      setQuote(null);
      onQuote?.(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate when the CEP is complete (auto mode) or the items change after a quote.
  useEffect(() => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8 || lastKey.current === digits + itemsKey) return;
    if (auto || quote) calc(cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep, itemsKey, auto]);

  const change = (e) => {
    const v = maskCep(e.target.value);
    setCep(v);
    onCepChange?.(v);
  };

  return (
    <div className={`ship ${compact ? 'ship--compact' : ''}`}>
      {/* not a <form>: this component is also used inside the checkout form */}
      {!hideInput && (
        <div className="ship__form">
          <label className="ship__label" htmlFor="ship-cep"><Truck width={20} height={20} /> Calcular frete</label>
          <div className="ship__row">
            <input id="ship-cep" className="input" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={cep} onChange={change}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); calc(); } }} />
            <button type="button" className="btn btn--ghost btn--sm" disabled={loading} onClick={() => calc()}>{loading ? '…' : 'Calcular'}</button>
          </div>
          <a className="ship__help" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer">Não sei meu CEP</a>
        </div>
      )}

      {loading && <p className="muted small">Consultando transportadoras…</p>}
      {error && <p className="alert small">{error}</p>}

      {quote && !loading && (
        <ul className="ship__list" role={onSelect ? 'radiogroup' : undefined}>
          {(limit && !showAll
            ? quote.options.filter((o, i) => i < limit || o.id === selectedId) // keep the chosen one visible
            : quote.options
          ).map((o) => {
            const on = selectedId === o.id;
            const body = (
              <>
                <span className="ship__name">
                  <b>{o.name}</b>
                  <small>{o.company && o.company.toLowerCase() !== o.name.toLowerCase() ? `${o.company} · ` : ''}{days(o.days)}</small>
                </span>
                <span className={`ship__price ${o.free ? 'good' : ''}`}>
                  {o.free ? <>Grátis <s>{formatPrice(o.originalPrice)}</s></> : formatPrice(o.price)}
                </span>
              </>
            );
            return onSelect ? (
              <li key={o.id}>
                <label className={`ship__opt ${on ? 'ship__opt--on' : ''}`}>
                  <input type="radio" name="shipping" checked={on} onChange={() => onSelect(o, quote)} />
                  {body}
                </label>
              </li>
            ) : (
              <li key={o.id} className="ship__opt">{body}</li>
            );
          })}
        </ul>
      )}
      {quote && !loading && limit > 0 && quote.options.length > limit && (
        <button type="button" className="link ship__more" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Ver menos opções' : `Ver mais ${quote.options.length - limit} ${quote.options.length - limit > 1 ? 'opções' : 'opção'}`}
        </button>
      )}
      {quote && !loading && !quote.freeShipping && (
        <p className="muted small">Frete grátis na opção mais barata em compras acima de {formatPrice(quote.freeFrom)}.</p>
      )}
    </div>
  );
}
