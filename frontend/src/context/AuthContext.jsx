import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id_usuario: payload.user_id,
          correo: payload.email || '',
          rol: payload.rol || '',
        });
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (correo, password) => {
    const res = await api.post('/auth/login/', { correo, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    setUser(res.data.usuario);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register/', data);
    return res.data;
  }, []);

  const verifyEmail = useCallback(async (token) => {
    const res = await api.post('/auth/verify-email/', { token });
    return res.data;
  }, []);

  const resendVerification = useCallback(async (correo) => {
    const res = await api.post('/auth/resend-verification/', { correo });
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, verifyEmail, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
