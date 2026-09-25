import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<UserProfile>) => void;
  currency: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = api.getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const { user } = await api.getCurrentUser();
        setUser(user);
        setToken(storedToken);
      } catch (err) {
        console.error('Failed to load user session:', err);
        api.clearToken();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('bluewave_auth_expired', handleExpired);
    return () => window.removeEventListener('bluewave_auth_expired', handleExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    api.setToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    api.clearToken();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const rawCurrency = (user?.currencySymbol || 'LKR').trim();
  const currency = ['$', '€', '£', '¥'].includes(rawCurrency)
    ? rawCurrency
    : `${rawCurrency} `;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        currency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
