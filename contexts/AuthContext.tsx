
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SyncStatus } from '../types';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'email' | 'google' | 'apple';
  isFounder?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'apple') => Promise<void>;
  signup: (name: string, email: string, password: string, avatar?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  syncStatus: SyncStatus;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FOUNDER_EMAILS = [
  'mkmmga972004@gmail.com',
  'itsahmedatallah@gmail.com'
];

const checkIsFounder = (email: string) => {
  return FOUNDER_EMAILS.includes(email.trim().toLowerCase());
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Session Recovery
  useEffect(() => {
    const recoverSession = async () => {
        const storedUser = localStorage.getItem('physique_auth_session');
        if (storedUser) {
          setSyncStatus('syncing');
          try {
              // Simulate token verification latency
              await new Promise(r => setTimeout(r, 800)); 
              setUser(JSON.parse(storedUser));
              setSyncStatus('synced');
          } catch (e) {
              localStorage.removeItem('physique_auth_session');
              setSyncStatus('error');
          }
        }
        setLoading(false);
    };
    recoverSession();
  }, []);

  const login = async (email: string, password: string) => {
    setSyncStatus('syncing');
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (password.length < 6) {
            setSyncStatus('error');
            reject(new Error("Incorrect credentials."));
            return;
        }
        const mockUser: User = {
          id: 'usr_' + btoa(email).substring(0, 10),
          name: email.split('@')[0], 
          email,
          provider: 'email',
          isFounder: checkIsFounder(email)
        };
        finalizeLogin(mockUser);
        resolve();
      }, 1500);
    });
  };

  const socialLogin = async (provider: 'google' | 'apple') => {
    setSyncStatus('syncing');
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            const email = `user@${provider}.com`; // In real app, this comes from provider
            const mockUser: User = {
                id: 'usr_' + Math.random().toString(36).substr(2, 9),
                name: 'Physique Athlete',
                email: email,
                provider,
                isFounder: checkIsFounder(email)
            };
            finalizeLogin(mockUser);
            resolve();
        }, 1200);
    });
  };

  const signup = async (name: string, email: string, password: string, avatar?: string) => {
    setSyncStatus('syncing');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: 'usr_' + btoa(email).substring(0, 10),
          name,
          email,
          avatar,
          provider: 'email',
          isFounder: checkIsFounder(email)
        };
        finalizeLogin(newUser);
        resolve();
      }, 1500);
    });
  };

  const finalizeLogin = (user: User) => {
      setUser(user);
      localStorage.setItem('physique_auth_session', JSON.stringify(user));
      setSyncStatus('synced');
  };

  const logout = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
        setUser(null);
        localStorage.removeItem('physique_auth_session');
        setSyncStatus('synced'); // Technically disconnected, but state is clean
    }, 500);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, socialLogin, logout, loading, syncStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
