import React, { createContext, useContext, useState, useEffect } from 'react';
import client, { setAccessToken } from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt silent refresh on initial load
    const silentRefresh = async () => {
      try {
        const res = await client.post('/auth/refresh');
        setAccessToken(res.data.data.accessToken);
        
        // Fetch user profile to restore user state
        const profileRes = await client.get('/profile/me');
        setUser({
          id: profileRes.data.data.id,
          name: profileRes.data.data.name,
          email: profileRes.data.data.email,
          avatar: profileRes.data.data.avatar,
        });
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    silentRefresh();
  }, []);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
