import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api';
import TagCard from '../components/TagCard';
import { Alert } from '../components/Icons';
import { ease } from '../motion';

// A tela que abre quando alguém escaneia a medalha. É a página mais importante do site:
// quem está vendo isso está com um pet perdido na mão, na rua, com uma mão só livre.
// O cartão em si mora em TagCard, que a prévia do painel também usa.
export default function PublicTag() {
  const { code } = useParams();
  const [tag, setTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api
      .tag(code)
      .then((t) => alive && setTag(t))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [code]);

  useEffect(() => {
    if (tag) document.title = `${tag.petName} · plaquinha ${tag.code}`;
  }, [tag]);

  if (loading) {
    return (
      <div className="empty">
        <div className="spinner" />
        <p className="muted">Carregando a identificação do pet…</p>
      </div>
    );
  }

  if (error || !tag) {
    return (
      <div className="empty container">
        <Alert width={56} height={56} />
        <h1>Plaquinha não encontrada</h1>
        <p className="muted">{error || 'Esta plaquinha ainda não foi ativada.'}</p>
        <Link className="btn btn--primary" to="/">
          Ir para a página inicial
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      className="tagview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
    >
      <TagCard tag={tag} />
    </motion.div>
  );
}
