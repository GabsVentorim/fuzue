import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { formatDateTime } from '../../labels';

const REASON = { venda: 'Venda', entrada: 'Entrada', ajuste: 'Ajuste', cancelamento: 'Cancelamento' };

function StockRow({ product, onSaved }) {
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const send = async (reason) => {
    let delta = Math.trunc(Number(qty));
    if (!delta) return setError('Informe a quantidade.');
    if (reason === 'saida') delta = -Math.abs(delta);
    try {
      onSaved(await api.admin.adjustStock(product.id, { delta, reason: reason === 'entrada' ? 'entrada' : 'ajuste', note }));
      setQty('');
      setNote('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const level = product.stock === 0 ? 'text-danger' : product.stock <= product.lowStockThreshold ? 'text-warn' : '';

  return (
    <tr className={product.active ? '' : 'row--muted'}>
      <td>
        <Link to={`/admin/produtos/${product.id}`} className="link">{product.name}</Link>
        {error && <div className="text-danger small">{error}</div>}
      </td>
      <td className={`num ${level}`}><b>{product.stock}</b></td>
      <td className="num muted">{product.lowStockThreshold}</td>
      <td>
        <div className="row row--tight">
          <input className="input input--sm" type="number" min={1} placeholder="Qtd." value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantidade" />
          <input className="input input--sm" placeholder="Obs. (opcional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Observação" />
          <button className="btn btn--ghost btn--xs" onClick={() => send('entrada')}>+ Entrada</button>
          <button className="btn btn--ghost btn--xs" onClick={() => send('saida')}>− Saída</button>
        </div>
      </td>
    </tr>
  );
}

export default function Stock() {
  const [params, setParams] = useSearchParams();
  const productId = params.get('produto') || '';
  const [products, setProducts] = useState(null);
  const [moves, setMoves] = useState([]);
  const [onlyLow, setOnlyLow] = useState(false);
  const [error, setError] = useState('');

  const loadMoves = () => api.admin.stockMovements({ productId }).then(setMoves).catch(() => {});

  useEffect(() => {
    api.admin.products().then(setProducts).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    loadMoves();
  }, [productId]);

  const saved = (p) => {
    setProducts((list) => list.map((x) => (x.id === p.id ? p : x)));
    loadMoves();
  };

  if (error) return <p className="alert">{error}</p>;
  if (!products) return <p className="muted">Carregando…</p>;

  let list = productId ? products.filter((p) => String(p.id) === productId) : products;
  if (onlyLow) list = list.filter((p) => p.stock <= p.lowStockThreshold);
  const total = products.filter((p) => p.active).reduce((s, p) => s + p.stock, 0);

  return (
    <div className="stack">
      <div className="toolbar">
        <h1 className="admin__h1">Estoque</h1>
        <div className="toolbar__right">
          {productId && <button className="chip" onClick={() => setParams({})}>Mostrar todos ✕</button>}
          <label className="check"><input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Só estoque baixo</label>
        </div>
      </div>
      <p className="muted small">{total} unidades em estoque nos produtos ativos.</p>

      <div className="panel table-wrap">
        <table className="table">
          <thead>
            <tr><th>Produto</th><th className="num">Estoque</th><th className="num">Alerta</th><th>Movimentar</th></tr>
          </thead>
          <tbody>
            {list.map((p) => <StockRow key={p.id} product={p} onSaved={saved} />)}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel__head"><h2>Histórico de movimentações</h2></div>
        {moves.length === 0 ? (
          <p className="muted small">Nenhuma movimentação ainda.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Data</th><th>Produto</th><th>Tipo</th><th className="num">Qtd.</th><th>Detalhe</th><th>Por</th></tr>
              </thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id}>
                    <td>{formatDateTime(m.createdAt)}</td>
                    <td><button className="link" onClick={() => setParams({ produto: m.productId })}>{m.productName}</button></td>
                    <td>{REASON[m.reason]}</td>
                    <td className={`num ${m.delta < 0 ? 'text-danger' : 'good'}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                    <td>{m.orderId ? <Link to={`/admin/pedidos?id=${m.orderId}`} className="link">{m.orderId}</Link> : m.note || '—'}</td>
                    <td className="muted">{m.userName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
