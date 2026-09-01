import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { DEMO_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (badgeId: string, passcode?: string) => boolean;
  loginAsDemoUser: (index: number) => void;
  logout: () => void;
  availableDemoUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('ibvap_auth_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    // Default logged in as Commanding Officer for seamless hackathon review
    return DEMO_USERS[0];
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ibvap_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ibvap_auth_user');
    }
  }, [currentUser]);

  const login = (badgeId: string, _passcode?: string): boolean => {
    const user = DEMO_USERS.find(
      (u) => u.badgeId.toLowerCase() === badgeId.trim().toLowerCase() || u.id.toLowerCase() === badgeId.trim().toLowerCase()
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    // Generic fallback login
    const customUser: User = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      badgeId: badgeId.toUpperCase(),
      name: `Officer ${badgeId.toUpperCase()}`,
      role: 'Surveillance Operator',
      clearanceLevel: 'SECRET LEVEL 3',
      team: 'BWU NEURAL NEXUS',
      unit: 'Border Surveillance Operations Unit',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    setCurrentUser(customUser);
    return true;
  };

  const loginAsDemoUser = (index: number) => {
    if (DEMO_USERS[index]) {
      setCurrentUser(DEMO_USERS[index]);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        loginAsDemoUser,
        logout,
        availableDemoUsers: DEMO_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
