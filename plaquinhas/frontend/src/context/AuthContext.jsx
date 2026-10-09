import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // A sessão vive num cookie httpOnly, então o estado de login é perguntado ao
  // servidor no carregamento — não há token no localStorage para ler.
  useEffect(() => {
    api.me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    setUser,
    login: async (body) => setUser(await api.login(body)),
    logout: async () => {
      await api.logout().catch(() => {});
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
