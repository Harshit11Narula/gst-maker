import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setCompany(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api('/auth/me');
      setCompany(data.company);
    } catch {
      setToken(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    setCompany(data.company);
    return data.company;
  };

  const signup = async (payload) => {
    const data = await api('/auth/signup', { method: 'POST', body: payload });
    setToken(data.token);
    setCompany(data.company);
    return data.company;
  };

  const logout = () => {
    setToken(null);
    setCompany(null);
  };

  const updateCompany = (next) => setCompany(next);

  return (
    <AuthContext.Provider
      value={{ company, loading, login, signup, logout, refresh, updateCompany }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
