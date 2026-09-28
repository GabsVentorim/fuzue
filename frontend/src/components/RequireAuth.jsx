import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Route guard: sends visitors to /entrar (and back afterwards); `admin` also requires the admin role.
export default function RequireAuth({ admin = false, children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <p className="muted center section">Carregando…</p>;
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  if (admin && !isAdmin) return <Navigate to="/minha-conta" replace />;
  return children;
}
