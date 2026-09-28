import { Link } from 'react-router-dom';
import { Paw } from '../components/Icons';

export default function NotFound() {
  return (
    <section className="section container empty">
      <Paw width={64} height={64} />
      <h1>Ops! Essa página fugiu no passeio</h1>
      <Link to="/" className="btn btn--primary">Voltar para o início</Link>
    </section>
  );
}
