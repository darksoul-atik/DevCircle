import React, { createContext, useContext, useState, useEffect } from 'react';
import client, { setAccessToken } from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
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
        // We need a way to get the user profile, for now we will just decode or 
        // ideally add a /users/me endpoint later. For now, since silent refresh 
        // doesn't return user info directly, we'll fetch profile later or we should 
        // return user info in the refresh response.
        // Let's assume we can fetch /users/me or we can just set authenticated true.
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
