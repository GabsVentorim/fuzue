import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    register: async (body) => setUser(await api.register(body)),
    loginWithGoogle: async (credential) => setUser(await api.google(credential)),
    logout: async () => {
      await api.logout().catch(() => {});
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
