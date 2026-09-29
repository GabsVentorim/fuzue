import { Link } from 'react-router-dom';
import Mascot from '../components/Mascot';

export default function NotFound() {
  return (
    <section className="section container empty">
      <Mascot className="mascot--empty mascot--tilt" />
      <h1>Ops! Essa página fugiu no passeio</h1>
      <Link to="/" className="btn btn--primary">Voltar para o início</Link>
    </section>
  );
}
