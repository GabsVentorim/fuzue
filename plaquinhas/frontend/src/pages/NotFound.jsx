import { Link } from 'react-router-dom';
import { Paw } from '../components/Icons';

export default function NotFound() {
  return (
    <div className="empty container">
      <Paw width={64} height={64} />
      <h1>Essa página fugiu</h1>
      <p className="muted">
        O endereço não existe. Se você escaneou uma medalha, confira se o código está completo.
      </p>
      <Link className="btn btn--primary" to="/">
        Voltar para o início
      </Link>
    </div>
  );
}
