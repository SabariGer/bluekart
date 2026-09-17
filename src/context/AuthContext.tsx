import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../data/seedData';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, pass: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEMO_USERS.customer); // Friendly default customer view
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for real Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const isAdminUser =
          firebaseUser.email === 'karthylock@gmail.com' ||
          (firebaseUser.email && firebaseUser.email.toLowerCase().includes('admin'));

        const profile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || 'customer@bluecart.de',
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer'),
          role: isAdminUser ? 'admin' : 'customer',
          avatar_url: firebaseUser.photoURL || undefined,
          created_at: new Date().toISOString(),
        };
        setUser(profile);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const u = res.user;
      const isAdminUser =
        u.email === 'karthylock@gmail.com' ||
        (u.email && u.email.toLowerCase().includes('admin'));

      const profile: UserProfile = {
        id: u.uid,
        email: u.email || '',
        name: u.displayName || u.email?.split('@')[0] || 'User',
        role: isAdminUser ? 'admin' : 'customer',
        avatar_url: u.photoURL || undefined,
        created_at: new Date().toISOString(),
      };
      setUser(profile);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Google Login failed' };
    }
  };

  const login = async (email: string, _pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (email.toLowerCase() === DEMO_USERS.admin.email.toLowerCase()) {
        setUser(DEMO_USERS.admin);
        setIsLoading(false);
        return { success: true };
      }

      if (email.toLowerCase() === DEMO_USERS.customer.email.toLowerCase()) {
        setUser(DEMO_USERS.customer);
        setIsLoading(false);
        return { success: true };
      }

      const isAdminUser =
        email.toLowerCase() === 'karthylock@gmail.com' ||
        email.toLowerCase().includes('admin');

      const customUser: UserProfile = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        role: isAdminUser ? 'admin' : 'customer',
        created_at: new Date().toISOString(),
      };
      setUser(customUser);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const signup = async (
    name: string,
    email: string,
    _pass: string,
    chosenRole: UserRole = 'customer'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        email,
        name,
        role: chosenRole,
        created_at: new Date().toISOString(),
      };
      setUser(newUser);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignored
    }
    setUser(null);
  };

  const loginAsDemo = (targetRole: UserRole) => {
    const demo = DEMO_USERS[targetRole];
    setUser(demo);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    setUser({ ...user, ...data });
  };

  const role: UserRole = user?.role || 'customer';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isLoading,
        login,
        loginWithGoogle,
        signup,
        logout,
        loginAsDemo,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
