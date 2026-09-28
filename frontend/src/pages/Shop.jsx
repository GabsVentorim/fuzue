import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import { Paw } from '../components/Icons';

const filters = [
  { slug: '', label: 'Tudo' },
  { slug: 'coleiras', label: 'Coleiras' },
  { slug: 'bandanas', label: 'Bandanas' },
  { slug: 'presilhas', label: 'Presilhas' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('categoria') || '';
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    const t = setTimeout(() => {
      api.products({ category, search, sort }).then(setProducts).catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [category, search, sort]);

  const setCategory = (slug) => setParams(slug ? { categoria: slug } : {});
  const title = filters.find((f) => f.slug === category)?.label || 'Tudo';

  return (
    <section className="section container">
      <h1 className="page-title">{category ? title : 'A lojinha'}</h1>

      <div className="toolbar">
        <div className="chips" role="tablist">
          {filters.map((f) => (
            <button
              key={f.slug}
              className={`chip ${category === f.slug ? 'chip--on' : ''}`}
              onClick={() => setCategory(f.slug)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="toolbar__right">
          <input
            className="input"
            type="search"
            placeholder="Buscar mimos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
            <option value="">Ordenar</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">A–Z</option>
          </select>
        </div>
      </div>

      {error && <p className="alert">{error}</p>}
      {!products && !error && <p className="muted center">Buscando os mimos…</p>}
      {products?.length === 0 && (
        <div className="empty">
          <Paw width={48} height={48} />
          <p>Nenhum produto encontrado. Que tal outra busca?</p>
        </div>
      )}
      <div className="grid">
        {products?.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
