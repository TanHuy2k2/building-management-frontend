import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ResponseInterface, User } from '../types';
import { getUserProfile } from '../services/userService';

interface AuthContextType {
  currentUser: User | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const login = async () => {
    try {
      const response: ResponseInterface = await getUserProfile();
      if (response.success) {
        setCurrentUser(response.data);
      }

      return response.data.user.roles;
    } catch (error) {
      console.error('Failed to load user profile on login attempt:', error);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
  };
  useEffect(() => {
    const checkAuthStatus = async () => {
      const accessToken = sessionStorage.getItem('access_token');
      if (accessToken) {
        try {
          const response = await getUserProfile();
          if (response.success) {
            setCurrentUser(response.data);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error fetching user profile on refresh:', error);
          logout();
        }
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
