import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import brand from '../brand';
import { asset } from '../assets';
import ProductCard from '../components/ProductCard';
import ProductArt from '../components/ProductArt';
import { Paw, Truck, Heart, Shield, Sparkle } from '../components/Icons';

const categories = [
  { slug: 'coleiras', name: 'Coleiras', text: 'Para passear com estilo', tone: 'pink', art: { color: '#E8432A', pattern: 'dots' } },
  { slug: 'bandanas', name: 'Bandanas', text: 'Charme no pescoço', tone: 'red', art: { color: '#F4A7D3', pattern: 'hearts' } },
  { slug: 'presilhas', name: 'Presilhas', text: 'Lacinhos que não puxam o pelo', tone: 'blue', art: { color: '#E8432A', pattern: 'dots' } },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.products({ featured: 'true' }).then(setFeatured).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <Paw className="float float--1" />
        <Paw className="float float--2" />
        <Sparkle className="float float--3" />
        <div className="container hero__grid">
          <div className="hero__text">
            <span className="pill">
              <Heart width={16} height={16} /> novidades fresquinhas
            </span>
            <h1>
              Mimos <span className="hl">coloridos</span> para o seu melhor amigo
            </h1>
            <p>Coleiras, bandanas e presilhas coloridas, confortáveis e feitas para brilhar nos passeios.</p>
            <div className="hero__cta">
              <Link to="/loja" className="btn btn--primary">Ver a lojinha</Link>
              <Link to="/loja?categoria=bandanas" className="btn btn--ghost">Bandanas novas</Link>
            </div>
          </div>
          {asset('hero') ? (
            <div className="hero__photo">
              <img src={asset('hero')} alt={brand.name} />
            </div>
          ) : (
            <div className="hero__art">
              <div className="blob blob--red"><ProductArt category="coleiras" color="#377DF8" pattern="dots" alt="Coleira" /></div>
              <div className="blob blob--blue"><ProductArt category="bandanas" color="#E8432A" pattern="hearts" alt="Bandana" /></div>
              <div className="blob blob--cream"><ProductArt category="presilhas" color="#F4A7D3" pattern="dots" alt="Presilha" /></div>
            </div>
          )}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section container">
        <h2 className="section__title">Escolha o mimo</h2>
        <div className="cats">
          {categories.map((c) => (
            <Link key={c.slug} to={`/loja?categoria=${c.slug}`} className={`cat cat--${c.tone}`}>
              <div className="cat__art">
                {asset(`categories.${c.slug}`) ? (
                  <img src={asset(`categories.${c.slug}`)} alt={c.name} className="cat__img" />
                ) : (
                  <ProductArt category={c.slug} {...c.art} alt={c.name} />
                )}
              </div>
              <h3>{c.name}</h3>
              <p>{c.text}</p>
              <span className="cat__go">Explorar →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="section container">
        <div className="section__head">
          <h2 className="section__title">Os queridinhos</h2>
          <Link to="/loja" className="link">Ver tudo →</Link>
        </div>
        {error && <p className="alert">Não conseguimos carregar os produtos. A API está rodando?</p>}
        <div className="grid">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* PERKS */}
      <section className="section container">
        <div className="perks">
          <div className="perk">
            <Truck />
            <div>
              <strong>Frete grátis</strong>
              <span>acima de R$ {brand.shipping.freeFrom}</span>
            </div>
          </div>
          <div className="perk">
            <Sparkle />
            <div>
              <strong>5% off no Pix</strong>
              <span>desconto na hora</span>
            </div>
          </div>
          <div className="perk">
            <Shield />
            <div>
              <strong>Troca fácil</strong>
              <span>tamanho não serviu? a gente troca</span>
            </div>
          </div>
          <div className="perk">
            <Heart />
            <div>
              <strong>Feito com amor</strong>
              <span>testado por pets de verdade</span>
            </div>
          </div>
        </div>
      </section>

      {/* SIZE HELP */}
      <section className="section container">
        <div className="sizes-box">
          <div>
            <h2>Qual tamanho escolher?</h2>
            <p>Meça o pescoço do seu pet com uma fita métrica e deixe espaço para dois dedinhos.</p>
          </div>
          <ul className="sizes-list">
            <li><b>P</b> 20–30 cm <small>gatos e cães pequenos</small></li>
            <li><b>M</b> 30–42 cm <small>cães médios</small></li>
            <li><b>G</b> 42–55 cm <small>cães grandes</small></li>
          </ul>
        </div>
      </section>
    </>
  );
}
