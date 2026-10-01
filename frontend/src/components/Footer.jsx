import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Paw } from './Icons';
import brand, { instagramLink, whatsappLink } from '../brand';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__wave" aria-hidden />
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
