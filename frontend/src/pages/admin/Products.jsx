import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { formatPrice } from '../../brand';
import ProductArt from '../../components/ProductArt';

export default function Products() {
  const [products, setProducts] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => api.admin.products({ q }).then(setProducts).catch((e) => setError(e.message)), 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="stack">
      <div className="toolbar">
        <h1 className="admin__h1">Produtos</h1>
        <div className="toolbar__right">
          <input className="input" type="search" placeholder="Buscar produto" value={q} onChange={(e) => setQ(e.target.value)} />
          <Link to="/admin/produtos/novo" className="btn btn--primary btn--sm">+ Novo produto</Link>
        </div>
      </div>
      {error && <p className="alert">{error}</p>}
      {!products ? (
        <p className="muted">Carregando…</p>
      ) : (
        <div className="panel table-wrap">
          <table className="table">
            <thead>
              <tr><th></th><th>Produto</th><th>Categoria</th><th className="num">Preço</th><th className="num">Estoque</th><th>Status</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.active ? '' : 'row--muted'}>
                  <td className="thumb">
                    <ProductArt category={p.category} color={p.colors[0]?.hex} pattern={p.pattern} image={p.image} alt="" />
                  </td>
                  <td>
                    <Link to={`/admin/produtos/${p.id}`} className="link">{p.name}</Link>
                    {p.featured && <span className="tag">destaque</span>}
                    {p.badge && <span className="tag tag--blue">{p.badge}</span>}
                  </td>
                  <td>{p.category}</td>
                  <td className="num">{formatPrice(p.price)}</td>
                  <td className={`num ${p.stock === 0 ? 'text-danger' : p.stock <= p.lowStockThreshold ? 'text-warn' : ''}`}>{p.stock}</td>
                  <td>{p.active ? 'Ativo' : 'Inativo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
