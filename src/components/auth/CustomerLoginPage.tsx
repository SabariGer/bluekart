import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EuropeanWhatsappLogin } from './EuropeanWhatsappLogin';
import {
  ShoppingBag,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Smartphone,
  KeyRound,
} from 'lucide-react';

interface CustomerLoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToAdmin: () => void;
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({
  onNavigateToRegister,
  onNavigateToAdmin,
}) => {
  const { login, loginAsDemo } = useAuth();
  const { t } = useLanguage();

  const [loginMethod, setLoginMethod] = useState<'whatsapp_otp' | 'password'>('whatsapp_otp');
  const [email, setEmail] = useState('customer@bluecart.store');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMessage(t('checkout.orderSuccess', 'Welcome back! Loading store...'));
      } else {
        setErrorMessage(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handle1ClickCustomer = () => {
    setEmail('customer@bluecart.store');
    setPassword('password123');
    loginAsDemo('customer');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-700 transition-colors">
        {/* Header inside card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-blue-600 text-white shadow-md mb-3 ring-4 ring-emerald-100 dark:ring-emerald-900/40">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('auth.customerLoginTitle')}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sign in with your European WhatsApp number or password to access your personalized profile, orders & tracking.
          </p>
        </div>

        {/* Login Method Toggle: WhatsApp OTP vs Password */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-5 text-xs font-semibold border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setLoginMethod('whatsapp_otp')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMethod === 'whatsapp_otp'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp / Email OTP</span>
          </button>

          <button
            type="button"
            onClick={() => setLoginMethod('password')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMethod === 'password'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password / Demo</span>
          </button>
        </div>

        {/* Method 1: European WhatsApp / Email OTP Authentication */}
        {loginMethod === 'whatsapp_otp' ? (
          <EuropeanWhatsappLogin
            onNavigateToPassword={() => setLoginMethod('password')}
          />
        ) : (
          /* Method 2: Standard Password Form + 1-Click Demo */
          <div>
            {/* 1-Click Instant Demo Access */}
            <div className="mb-6 p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {t('auth.demoNotice')}
                </span>
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Auto-Fill</span>
              </div>
              <button
                type="button"
                onClick={handle1ClickCustomer}
                className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>1-Click Customer Sign In (Alex Morgan)</span>
              </button>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl text-center">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@bluecart.store"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                    {t('auth.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('password123')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Auto-fill password
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing In...' : t('auth.signInBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Links to Create Account & Admin Portal */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 space-y-3 text-center text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            {t('auth.noAccount')}{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              {t('auth.customerRegisterTitle')}
            </button>
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer text-[11px] font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t('auth.isAdminPrompt')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

