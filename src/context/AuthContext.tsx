import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../api/supabaseClient';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  login: (badgeId: string, passcode?: string) => boolean;
  loginAsDemoUser: (indexOrRole: number | UserRole) => void;
  logout: () => void;
  availableDemoUsers: User[];
  isSupabaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('ibvap_auth_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const syncUserProfile = useCallback(async (user: SupabaseUser): Promise<User> => {
    let fullName = (user.user_metadata?.full_name as string) || '';
    let role: UserRole = (user.user_metadata?.role as UserRole) || 'Commander';

    if (isSupabaseConfigured()) {
      try {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileErr && profile) {
          if (profile.full_name) fullName = profile.full_name;
          if (profile.role) role = profile.role as UserRole;
        }
      } catch (err) {
        console.warn('Could not query public.profiles:', err);
      }
    }

    if (!fullName) {
      fullName = user.email ? user.email.split('@')[0].toUpperCase().replace('.', ' ') : 'Officer';
    }

    const clearanceLevel =
      role === 'Admin'
        ? 'TOP SECRET / DEFENSE ADMIN LEVEL 5'
        : role === 'Commander'
        ? 'COMMAND CLEARANCE / DEFENSE LEVEL 4'
        : 'ANALYST CLEARANCE / DEFENSE LEVEL 3';

    const unit =
      role === 'Admin'
        ? 'HQ Border Defense Systems Command'
        : role === 'Commander'
        ? '12th Border Guard Tactical Wing'
        : 'Sector Surveillance Ops';

    const mappedUser: User = {
      id: user.id,
      badgeId: `BSF-${user.id.slice(0, 6).toUpperCase()}`,
      name: fullName,
      email: user.email,
      role,
      clearanceLevel,
      team: 'BWU NEURAL NEXUS',
      unit,
      avatar:
        role === 'Admin'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          : role === 'Analyst'
          ? 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    setCurrentUser(mappedUser);
    localStorage.setItem('ibvap_auth_user', JSON.stringify(mappedUser));
    return mappedUser;
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured()) {
      try {
        const stored = localStorage.getItem('ibvap_auth_user');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch {
        // fallback
      }
      setIsLoading(false);
      return;
    }

    // Check existing session
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        if (!isMounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          syncUserProfile(currentSession.user).finally(() => {
            if (isMounted) setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to retrieve Supabase session:', err);
        if (isMounted) setIsLoading(false);
      });

    // Subscribe to auth state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      if (newSession?.access_token) {
        localStorage.setItem('ibvap_access_token', newSession.access_token);
      } else {
        localStorage.removeItem('ibvap_access_token');
      }
      if (newSession?.user) {
        await syncUserProfile(newSession.user);
      } else {
        setCurrentUser(null);
        localStorage.removeItem('ibvap_auth_user');
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserProfile]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const role: UserRole = email.toLowerCase().includes('admin')
          ? 'Admin'
          : email.toLowerCase().includes('analyst')
          ? 'Analyst'
          : 'Commander';

        const mockUser: User = {
          id: `usr_demo_${Date.now()}`,
          badgeId: `DEF-${Math.floor(1000 + Math.random() * 9000)}`,
          name: email.split('@')[0].toUpperCase().replace('.', ' '),
          email,
          role,
          clearanceLevel:
            role === 'Admin'
              ? 'TOP SECRET / DEFENSE ADMIN LEVEL 5'
              : role === 'Commander'
              ? 'COMMAND CLEARANCE / DEFENSE LEVEL 4'
              : 'ANALYST CLEARANCE / DEFENSE LEVEL 3',
          team: 'BWU NEURAL NEXUS',
          unit: '12th Border Guard Tactical Wing',
          avatar:
            role === 'Admin'
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setCurrentUser(mockUser);
        localStorage.setItem('ibvap_auth_user', JSON.stringify(mockUser));
        setIsLoading(false);
        return { success: true };
      }

      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authErr) {
        setError(authErr.message);
        setIsLoading(false);
        return { success: false, error: authErr.message };
      }

      if (data.user) {
        await syncUserProfile(data.user);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const mockUser: User = {
          id: `usr_reg_${Date.now()}`,
          badgeId: `DEF-${Math.floor(1000 + Math.random() * 9000)}`,
          name: fullName || 'Defense Personnel',
          email,
          role,
          clearanceLevel:
            role === 'Admin'
              ? 'TOP SECRET / DEFENSE ADMIN LEVEL 5'
              : role === 'Commander'
              ? 'COMMAND CLEARANCE / DEFENSE LEVEL 4'
              : 'ANALYST CLEARANCE / DEFENSE LEVEL 3',
          team: 'BWU NEURAL NEXUS',
          unit: 'Border Surveillance Operations Unit',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setCurrentUser(mockUser);
        localStorage.setItem('ibvap_auth_user', JSON.stringify(mockUser));
        setIsLoading(false);
        return { success: true };
      }

      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role,
          },
        },
      });

      if (authErr) {
        setError(authErr.message);
        setIsLoading(false);
        return { success: false, error: authErr.message };
      }

      if (data.user) {
        // Attempt explicit profile write for direct database consistency
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            role: role,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // Handled by database trigger
        }

        if (data.session) {
          await syncUserProfile(data.user);
        }
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up request failed. Please check your details.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Sign out warning:', e);
    } finally {
      setCurrentUser(null);
      setSession(null);
      localStorage.removeItem('ibvap_auth_user');
      localStorage.removeItem('ibvap_access_token');
      setIsLoading(false);
    }
  };

  const logout = () => {
    signOut();
  };

  const loginAsDemoUser = (indexOrRole: number | UserRole) => {
    if (typeof indexOrRole === 'number') {
      const selected = DEMO_USERS[indexOrRole] || DEMO_USERS[0];
      setCurrentUser(selected);
      localStorage.setItem('ibvap_auth_user', JSON.stringify(selected));
    } else {
      const role = indexOrRole;
      const found = DEMO_USERS.find((u) => u.role === role);
      if (found) {
        setCurrentUser(found);
        localStorage.setItem('ibvap_auth_user', JSON.stringify(found));
      } else {
        const demoUser: User = {
          id: `USR-${role.toUpperCase()}`,
          badgeId: `DEF-${role.toUpperCase()}-01`,
          name: `${role} Officer`,
          email: `${role.toLowerCase()}@ibvap.mil`,
          role: role,
          clearanceLevel:
            role === 'Admin'
              ? 'TOP SECRET / DEFENSE ADMIN LEVEL 5'
              : role === 'Commander'
              ? 'COMMAND CLEARANCE / DEFENSE LEVEL 4'
              : 'ANALYST CLEARANCE / DEFENSE LEVEL 3',
          team: 'BWU NEURAL NEXUS',
          unit: 'Border Surveillance Operations Unit',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setCurrentUser(demoUser);
        localStorage.setItem('ibvap_auth_user', JSON.stringify(demoUser));
      }
    }
  };

  const login = (badgeId: string, _passcode?: string): boolean => {
    const user = DEMO_USERS.find(
      (u) =>
        u.badgeId?.toLowerCase() === badgeId.trim().toLowerCase() ||
        u.id.toLowerCase() === badgeId.trim().toLowerCase()
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('ibvap_auth_user', JSON.stringify(user));
      return true;
    }
    const customUser: User = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      badgeId: badgeId.toUpperCase(),
      name: `Officer ${badgeId.toUpperCase()}`,
      role: 'Commander',
      clearanceLevel: 'SECRET LEVEL 3',
      team: 'BWU NEURAL NEXUS',
      unit: 'Border Surveillance Operations Unit',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    setCurrentUser(customUser);
    localStorage.setItem('ibvap_auth_user', JSON.stringify(customUser));
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        token: session?.access_token || null,
        isAuthenticated: !!currentUser,
        isLoading,
        error,
        clearError,
        signIn,
        signUp,
        signOut,
        login,
        loginAsDemoUser,
        logout,
        availableDemoUsers: DEMO_USERS,
        isSupabaseActive: isSupabaseConfigured(),
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
