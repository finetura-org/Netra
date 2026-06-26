import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

const guestUser = { username: 'analyst_guest', id: 1 };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(guestUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('netra_token');
    const savedUser = localStorage.getItem('netra_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('netra_token');
        localStorage.removeItem('netra_user');
        setUser(guestUser);
      }
    } else {
      setUser(guestUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const response = await client.post('/auth/login', { username, password });
      const { access_token, user_id, username: returnedUsername } = response.data;
      
      localStorage.setItem('netra_token', access_token);
      const userObj = { username: returnedUsername, id: user_id };
      localStorage.setItem('netra_user', JSON.stringify(userObj));
      setUser(userObj);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed. Please check your credentials.',
      };
    }
  }, []);

  const register = useCallback(async (username, password) => {
    try {
      await client.post('/auth/register', { username, password });
      return await login(username, password);
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed. Please try again.',
      };
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('netra_token');
    localStorage.removeItem('netra_user');
    setUser(guestUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
