import { Link } from 'react-router-dom';
import Logo from './Logo';
import Horizon from './Horizon';
import Stickers from './Stickers';
import { Paw } from './Icons';
import brand, { instagramLink, whatsappLink } from '../brand';

export default function Footer() {
  return (
    <footer className="footer">
      <Horizon tone="footer" />
      <Stickers items={[
        { kind: 'halftone', color: '#9cc3ff', size: 'clamp(90px, 10vw, 140px)', top: 'clamp(-70px, -5vw, -40px)', right: '4%' },
        { kind: 'star', color: '#f7b6d9', size: 48, top: 'clamp(-62px, -4vw, -40px)', left: '38%', rot: -12, hideMobile: true },
        { kind: 'dachshund', color: '#fe2a0a', size: 'clamp(70px, 8vw, 104px)', top: 'clamp(-96px, -7vw, -64px)', left: 0, walk: true },
      ]} />
      <div className="container footer__grid">
        <div>
          <Logo variant="light" />
          <p className="footer__slogan">{brand.slogan}</p>
        </div>
        <div>
          <h4>Loja</h4>
          <Link to="/loja?categoria=coleiras">Coleiras</Link>
          <Link to="/loja?categoria=bandanas">Bandanas</Link>
          <Link to="/loja?categoria=presilhas">Presilhas</Link>
          <Link to="/guia-de-tamanhos">Guia de tamanhos</Link>
        </div>
        <div>
          <h4>Fale com a gente</h4>
          <a href={whatsappLink(`Oi, ${brand.name}!`)} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={`mailto:${brand.email}`}>{brand.email}</a>
          <a href={instagramLink()} target="_blank" rel="noreferrer">Instagram {brand.instagram}</a>
        </div>
      </div>
      <p className="footer__copy container">
        <Paw width={16} height={16} /> © {new Date().getFullYear()} {brand.name} — feito com muito amor (e petiscos)
      </p>
    </footer>
  );
}
