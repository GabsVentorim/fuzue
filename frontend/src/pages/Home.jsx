import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import brand from '../brand';
import { asset } from '../assets';
import ProductCard from '../components/ProductCard';
import ProductArt from '../components/ProductArt';
import SizeGuide from '../components/SizeGuide';
import HeroCarousel from '../components/HeroCarousel';
import Horizon from '../components/Horizon';
import ParkTrail from '../components/ParkTrail';
import useReveal from '../hooks/useReveal';
import Stickers from '../components/Stickers';
import { Paw, Sparkle, Arrow } from '../components/Icons';

const categories = [
  { slug: 'coleiras', name: 'Coleiras', text: 'Para passear com estilo', tone: 'red', art: { color: '#F4A7D3', pattern: 'dots' } },
  { slug: 'bandanas', name: 'Bandanas', text: 'Charme no pescoço', tone: 'blue', art: { color: '#E8432A', pattern: 'hearts' } },
  { slug: 'presilhas', name: 'Presilhas', text: 'Lacinhos que não puxam o pelo', tone: 'pink', art: { color: '#377DF8', pattern: 'dots' } },
];

// Park signposts: one per category, planted along the trail.
function Signposts() {
  const [ref, shown] = useReveal();
  return (
    <div className={`signs ${shown ? 'is-in' : ''}`} ref={ref}>
      {categories.map((c, i) => (
        <Link key={c.slug} to={`/loja?categoria=${c.slug}`} className={`sign sign--${c.tone}`} style={{ '--i': i }}>
          <span className="sign__board">
            <span className="sign__art">
              {asset(`categories.${c.slug}`) ? (
                <img src={asset(`categories.${c.slug}`)} alt="" className="cat__img" />
              ) : (
                <ProductArt category={c.slug} {...c.art} alt="" />
              )}
            </span>
            <span className="sign__text">
              <b>{c.name}</b>
              <span>{c.text}</span>
            </span>
            <Arrow className="sign__go" width={26} height={26} aria-hidden />
          </span>
          <span className="sign__post" aria-hidden />
        </Link>
      ))}
    </div>
  );
}

// The favourites: the first one gets the big spot (2x2 on desktop, full width on phones) and the rest
// gather around it. A last "see everything" spot fills exactly the cells left over, so the grid never
// ends with a hole.
function Favourites({ products }) {
  const [ref, shown] = useReveal({ threshold: 0.05 });
  const n = products.length;
  const desktopFree = n ? (4 - ((Math.max(0, n - 5)) % 4)) % 4 || (n < 5 ? 4 - (n - 1) : 0) : 0;
  const phoneFree = n ? (n - 1) % 2 && 1 : 0;
  return (
    <div className={`grid grid--stagger ${shown ? 'is-in' : ''}`} ref={ref}>
      {products.map((p, i) => (
        <div key={p.id} style={{ '--i': i }}>
          <ProductCard product={p} index={i} />
        </div>
      ))}
      {n > 0 && (desktopFree > 0 || phoneFree > 0) && (
        <Link
          to="/loja"
          className="more-spot"
          style={{ '--i': n, '--span-d': desktopFree, '--span-m': phoneFree }}
          data-d={desktopFree || undefined}
          data-m={phoneFree || undefined}
        >
          <span className="more-spot__text">Ver todos os mimos</span>
          <Arrow width={30} height={30} aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [error, setError] = useState('');
  const [banners, setBanners] = useState(null); // null = loading

  useEffect(() => {
    api.products({ featured: 'true' }).then(setFeatured).catch((e) => setError(e.message));
    api.banners().then(setBanners).catch(() => setBanners([]));
  }, []);

  return (
    <>
      {/* HERO — the carousel from Admin → Carrossel (full width, edge to edge), sinking into the park's hills;
          the original hero shows while there are no banners */}
      {banners === null ? (
        <section className="hero-carousel"><div className="carousel carousel--loading" aria-hidden /><Horizon /></section>
      ) : banners.length > 0 ? (
        <section className="hero-carousel">
          <HeroCarousel banners={banners} />
          <Horizon />
        </section>
      ) : (
        <section className="hero">
          <Paw className="float float--1" />
          <Paw className="float float--2" />
          <Sparkle className="float float--3" />
          <div className="container hero__grid">
            <div className="hero__text">
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
          <Horizon />
        </section>
      )}

      {/* the walk: one trail from the hills down to the footer, with the ball rolling along it */}
      <ParkTrail>
        <section className="park__stop container">
          <Stickers items={[
            { kind: 'ola', size: 'clamp(104px, 15vw, 210px)', top: 'clamp(-34px, -2vw, 0px)', right: '0', rot: -9, m: { top: '-52px', right: '4px', size: 84 } },
            { kind: 'burst', color: '#ff2a0a', size: 58, top: '30px', left: '54%', rot: 10, hideMobile: true },
            { kind: 'star', color: '#9ecfd3', size: 56, bottom: '22px', left: '31%', rot: 14, hideMobile: true },
            { kind: 'sparkle', color: '#f7b6d9', size: 40, bottom: '30px', left: '64%', hideMobile: true },
            { kind: 'dogSit', color: '#fe2a0a', size: 88, bottom: '-10px', right: '6%', rot: 4, hideMobile: true },
          ]} />
          <h2 className="park__title">Escolha o mimo</h2>
          <Signposts />
        </section>

        <section className="park__stop container">
          <Stickers items={[
            { kind: 'fdm', size: 'clamp(96px, 11vw, 150px)', top: 'clamp(-44px, -3vw, -20px)', right: 'clamp(90px, 16%, 210px)', rot: 7, m: { top: '-56px', right: '6px', size: 66 } },
            { kind: 'flower', color: '#1e9bea', faced: true, size: 72, top: '46%', left: '-4.5%', rot: -10, hideMobile: true },
            { kind: 'heart', color: '#f2232a', faced: true, wink: true, size: 62, bottom: '16%', right: '-4.5%', rot: 12, hideMobile: true },
            { kind: 'bone', color: '#377df8', size: 70, top: '22%', right: '-5%', rot: -18, hideMobile: true },
            { kind: 'paw', color: '#fe2a0a', size: 46, bottom: '4%', left: '-4%', rot: 14, hideMobile: true },
          ]} />
          <div className="section__head">
            <h2 className="park__title">Os queridinhos</h2>
            <Link to="/loja" className="link link--trail">Ver tudo <Arrow width={18} height={18} aria-hidden /></Link>
          </div>
          {error && <p className="alert">Ops, os mimos se esconderam! Recarregue a página para chamá-los de volta.</p>}
          <Favourites products={featured} />
        </section>


        <section className="park__stop container">
          <Stickers items={[
            { kind: 'rainbow', size: 'clamp(70px, 8vw, 110px)', top: 'clamp(4px, 1vw, 10px)', right: '5%', rot: -8 },
            { kind: 'triangle', color: '#f2b33d', faced: true, size: 58, top: '14px', left: '2%', rot: -14, hideMobile: true },
            { kind: 'squiggle', color: '#5b6cf0', size: 110, bottom: '4px', left: '38%', rot: -4, hideMobile: true },
            { kind: 'dogHead', color: '#fe2a0a', size: 'clamp(56px, 7vw, 84px)', top: '-30px', left: '30%', rot: -8 },
          ]} />
          <SizeGuide />
        </section>
      </ParkTrail>
    </>
  );
}
