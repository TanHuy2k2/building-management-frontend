import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ResponseInterface, User } from '../types';
import { getUserProfile } from '../services/userService';
import { logoutApi } from '../services/authService';
import toast from 'react-hot-toast';
import { getAccessToken } from '../services/tokenService';

interface AuthContextType {
  currentUser: User | null;
  fetchCurrentUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const fetchCurrentUser = async () => {
    try {
      const res: ResponseInterface = await getUserProfile();
      if (res.success) {
        setCurrentUser(res.data);
      }
    } catch (error) {
      console.error('Fetch current user failed:', error);
    }
  };

  const logout = async () => {
    try {
      const response: ResponseInterface | null = await logoutApi();
      if (!response) {
        toast.error('Cannot logout!');

        return;
      }

      sessionStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setCurrentUser(null);
      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.message);

      return;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await getAccessToken();
      if (!token) return;

      try {
        const res = await getUserProfile();
        if (res.success) {
          setCurrentUser(res.data);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, fetchCurrentUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');

  return context;
}
