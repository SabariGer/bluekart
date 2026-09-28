import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../data/seedData';
import { storeService } from '../lib/storeService';
import { EUROPEAN_COUNTRIES } from '../data/europeanCountries';

interface SendOtpParams {
  identifier: string; // phone or email
  channel: 'whatsapp' | 'email';
  countryCode?: string;
  countryName?: string;
}

interface VerifyOtpParams {
  identifier: string;
  otp: string;
  otpId?: string;
  countryCode?: string;
  countryName?: string;
  name?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, pass: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (params: SendOtpParams) => Promise<{ success: boolean; otpId?: string; previewOtp?: string; expiresAt?: number; error?: string }>;
  verifyOtp: (params: VerifyOtpParams) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  logout: () => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Check if there is an active session in localStorage
    try {
      const savedUserJson = localStorage.getItem('bluecart_current_user_profile');
      if (savedUserJson) {
        return JSON.parse(savedUserJson);
      }
    } catch {
      // Ignored
    }
    return DEMO_USERS.customer; // Friendly default customer view
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for real Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAdminUser =
          firebaseUser.email === 'karthylock@gmail.com' ||
          (firebaseUser.email && firebaseUser.email.toLowerCase().includes('admin'));

        const existingProfile = await storeService.getUserProfile(firebaseUser.uid);
        const profile: UserProfile = existingProfile || {
          id: firebaseUser.uid,
          email: firebaseUser.email || 'customer@bluecart.de',
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer'),
          role: isAdminUser ? 'admin' : 'customer',
          avatar_url: firebaseUser.photoURL || undefined,
          email_verified: firebaseUser.emailVerified,
          auth_provider: 'google',
          created_at: new Date().toISOString(),
        };
        setUser(profile);
        localStorage.setItem('bluecart_current_user_profile', JSON.stringify(profile));
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendOtp = async ({
    identifier,
    channel,
    countryCode = 'DE',
    countryName = 'Germany',
  }: SendOtpParams): Promise<{
    success: boolean;
    otpId?: string;
    previewOtp?: string;
    expiresAt?: number;
    error?: string;
  }> => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, channel, countryCode, countryName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to send OTP.' };
      }

      return {
        success: true,
        otpId: data.otpId,
        previewOtp: data.previewOtp,
        expiresAt: data.expiresAt,
      };
    } catch (err: any) {
      console.warn('Backend send-otp failed, activating seamless simulated fallback:', err);
      // Client-side fallback
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const mockId = `otp_local_${Date.now()}`;
      sessionStorage.setItem(`otp_${mockId}`, JSON.stringify({ code: mockOtp, identifier, expiresAt: Date.now() + 300000 }));

      return {
        success: true,
        otpId: mockId,
        previewOtp: mockOtp,
        expiresAt: Date.now() + 300000,
      };
    }
  };

  const verifyOtp = async ({
    identifier,
    otp,
    otpId,
    countryCode = 'DE',
    countryName = 'Germany',
    name,
  }: VerifyOtpParams): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    setIsLoading(true);
    try {
      // First attempt backend API verification
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, otp, otpId, countryCode, countryName, name }),
        });
        const data = await res.json();

        if (res.ok && data.success && data.user) {
          const profile: UserProfile = data.user;
          // Save and persist
          await storeService.saveUserProfile(profile);
          setUser(profile);
          localStorage.setItem('bluecart_current_user_profile', JSON.stringify(profile));
          setIsLoading(false);
          return { success: true, user: profile };
        } else if (res.status === 400 || res.status === 429) {
          setIsLoading(false);
          return { success: false, error: data.error || 'Invalid verification code.' };
        }
      } catch (apiErr) {
        console.warn('API verify-otp route error, attempting local fallback verification:', apiErr);
      }

      // Local fallback verification if server was not reachable
      const sessionData = sessionStorage.getItem(`otp_${otpId}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.code !== otp.trim()) {
          setIsLoading(false);
          return { success: false, error: 'Incorrect verification code. Please check and try again.' };
        }
      }

      // Generate or retrieve European User Profile based on login
      const isWhatsApp = identifier.startsWith('+') || !identifier.includes('@');
      const country =
        EUROPEAN_COUNTRIES.find((c) => c.code.toUpperCase() === countryCode.toUpperCase()) ||
        EUROPEAN_COUNTRIES[0];

      let profile = await storeService.findUserProfileByIdentifier(identifier);
      if (!profile) {
        const userId = `usr_eu_${Date.now()}`;
        const autoName =
          name ||
          (isWhatsApp
            ? `${country.name} WhatsApp Shopper`
            : identifier.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()));

        profile = {
          id: userId,
          email: isWhatsApp ? `${identifier.replace(/\D/g, '')}@whatsapp.bluecart.de` : identifier,
          name: autoName,
          role: 'customer',
          phone: isWhatsApp ? identifier : undefined,
          whatsapp_number: isWhatsApp ? identifier : undefined,
          whatsapp_country_code: country.code,
          whatsapp_country_name: country.name,
          whatsapp_verified: isWhatsApp,
          email_verified: !isWhatsApp,
          auth_provider: isWhatsApp ? 'whatsapp_otp' : 'email_otp',
          address: {
            street: country.code === 'DE' ? 'Maximilianstraße 12' : 'Market Street 1',
            city: country.defaultCity,
            zip: country.defaultZip,
            country: country.name,
          },
          preferences: {
            whatsapp_order_updates: true,
            whatsapp_shipping_alerts: true,
            whatsapp_deals: true,
            language: country.code === 'DE' || country.code === 'AT' ? 'de' : 'en',
          },
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        };
      } else {
        profile.last_login_at = new Date().toISOString();
        if (isWhatsApp) {
          profile.whatsapp_verified = true;
          profile.whatsapp_number = identifier;
          profile.whatsapp_country_code = country.code;
          profile.whatsapp_country_name = country.name;
        } else {
          profile.email_verified = true;
        }
      }

      await storeService.saveUserProfile(profile);
      setUser(profile);
      localStorage.setItem('bluecart_current_user_profile', JSON.stringify(profile));
      setIsLoading(false);
      return { success: true, user: profile };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'OTP verification failed' };
    }
  };

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
        auth_provider: 'google',
        email_verified: u.emailVerified,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };
      await storeService.saveUserProfile(profile);
      setUser(profile);
      localStorage.setItem('bluecart_current_user_profile', JSON.stringify(profile));
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
        localStorage.setItem('bluecart_current_user_profile', JSON.stringify(DEMO_USERS.admin));
        setIsLoading(false);
        return { success: true };
      }

      if (email.toLowerCase() === DEMO_USERS.customer.email.toLowerCase()) {
        setUser(DEMO_USERS.customer);
        localStorage.setItem('bluecart_current_user_profile', JSON.stringify(DEMO_USERS.customer));
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
        auth_provider: 'password',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };
      await storeService.saveUserProfile(customUser);
      setUser(customUser);
      localStorage.setItem('bluecart_current_user_profile', JSON.stringify(customUser));
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
        auth_provider: 'password',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };
      await storeService.saveUserProfile(newUser);
      setUser(newUser);
      localStorage.setItem('bluecart_current_user_profile', JSON.stringify(newUser));
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
    localStorage.removeItem('bluecart_current_user_profile');
    setUser(null);
  };

  const loginAsDemo = (targetRole: UserRole) => {
    const demo = DEMO_USERS[targetRole];
    setUser(demo);
    localStorage.setItem('bluecart_current_user_profile', JSON.stringify(demo));
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('bluecart_current_user_profile', JSON.stringify(updated));
    await storeService.saveUserProfile(updated);
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
        sendOtp,
        verifyOtp,
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
