import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EUROPEAN_COUNTRIES } from '../../data/europeanCountries';
import { UserPlus, Lock, Mail, User, Globe, ArrowRight, CheckCircle2, ShieldCheck, ArrowLeft, Smartphone } from 'lucide-react';

interface CustomerRegisterPageProps {
  onNavigateToLogin: () => void;
  onNavigateToAdmin: () => void;
}

export const CustomerRegisterPage: React.FC<CustomerRegisterPageProps> = ({
  onNavigateToLogin,
  onNavigateToAdmin,
}) => {
  const { signup, updateProfile } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('+49 170 1234567');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Germany');
  const [city, setCity] = useState('Munich');
  const [agreed, setAgreed] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setErrorMessage('Please accept the terms and privacy policy');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signup(name, email, password, 'customer');
      if (res.success) {
        // Save initial European address & WhatsApp information
        await updateProfile({
          phone: whatsappPhone,
          whatsapp_number: whatsappPhone,
          whatsapp_verified: true,
          address: {
            street: 'Maximilianstraße 12',
            city: city || 'Munich',
            state: 'BY',
            zip: '80539',
            country: country || 'Germany',
          },
          preferences: {
            whatsapp_order_updates: true,
            whatsapp_shipping_alerts: true,
            whatsapp_deals: true,
          },
        });
        setSuccessMessage('Account created successfully with European WhatsApp integration! Loading your store...');
      } else {
        setErrorMessage(res.error || 'Failed to create customer account');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  const fillGermanDemoCustomer = () => {
    setName('Maximilian Weber');
    setEmail('max.weber@example.de');
    setWhatsappPhone('+49 170 1234567');
    setPassword('securePass123!');
    setCountry('Germany');
    setCity('Munich');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-700 transition-colors">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-md mb-3 ring-4 ring-emerald-100 dark:ring-emerald-900/40">
            <UserPlus className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('auth.customerRegisterTitle')}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('auth.customerRegisterSub')}
          </p>
        </div>

        {/* Quick sample fill */}
        <div className="mb-4 flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
          <span className="text-slate-600 dark:text-slate-400">Testing registration?</span>
          <button
            type="button"
            onClick={fillGermanDemoCustomer}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            Auto-fill Sample Buyer (Munich)
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('auth.fullName')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maximilian Weber"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 outline-none transition-all"
              />
            </div>
          </div>

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
                placeholder="name@example.de"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              European WhatsApp Phone Number
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+49 170 1234567"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('auth.country')}
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none text-xs"
                >
                  <option value="Germany">Germany 🇩🇪</option>
                  <option value="Austria">Austria 🇦🇹</option>
                  <option value="Switzerland">Switzerland 🇨🇭</option>
                  <option value="United States">United States 🇺🇸</option>
                  <option value="United Kingdom">United Kingdom 🇬🇧</option>
                  <option value="France">France 🇫🇷</option>
                  <option value="Netherlands">Netherlands 🇳🇱</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('auth.city')}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Munich / Berlin"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none text-xs"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                I agree to the <span className="underline">Terms & Conditions (AGB)</span> and{' '}
                <span className="underline">Privacy Policy (DSGVO)</span>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Creating Account...' : t('auth.createAccountBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Navigation links */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('auth.alreadyAccount')} {t('auth.signInBtn')}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToAdmin}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 text-[11px] pt-1 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('auth.isAdminPrompt')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
