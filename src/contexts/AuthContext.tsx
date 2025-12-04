import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "../types";
import { mockUsers } from "../data/mockData";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, role: "manager" | "user") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (email: string, role: "manager" | "user") => {
    // Find user by email and role
    const user = mockUsers.find((u) => u.email === email && u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
