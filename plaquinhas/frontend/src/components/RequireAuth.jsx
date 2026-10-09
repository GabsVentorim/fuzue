import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Guarda de rota: manda visitantes para /entrar (e de volta depois).
// `admin` também exige o papel de admin.
//
// O redirecionamento acontece num efeito, e não com <Navigate> durante o render, por
// causa da transição entre páginas (AnimatePresence, em App.jsx): ela mantém esta tela
// montada enquanto sai, e o <Routes location={...}> congela a localização da subárvore —
// então um <Navigate> aqui dispararia de novo a cada render, num laço de navegação.
// Como as dependências do efeito não mudam enquanto a tela sai, ele roda uma vez só.
export default function RequireAuth({ admin = false, children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const blocked = !loading && (!user || (admin && !isAdmin));
  const to = !user ? '/entrar' : '/';
  const from = location.pathname + location.search;

  useEffect(() => {
    if (blocked) navigate(to, { replace: true, state: { from } });
    // `from` de propósito fora das dependências: ele é só o ponto de partida guardado
    // para depois do login, e não deve reagendar o redirecionamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked, to, navigate]);

  if (loading) return <p className="muted center section">Carregando…</p>;
  if (blocked) return null;
  return children;
}
