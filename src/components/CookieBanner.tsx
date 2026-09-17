import React, { useState, useEffect } from 'react';
import { Shield, Settings, Check, X, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LegalTab } from './LegalModal';

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const COOKIE_STORAGE_KEY = 'bluecart_cookie_consent_v1';

interface CookieBannerProps {
  onOpenLegalTab: (tab: LegalTab) => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenLegalTab }) => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    functional: true,
    analytics: false,
    marketing: false,
    timestamp: '',
  });

  useEffect(() => {
    // Show after brief delay for smooth appearance if consent not yet given in session
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Listen for custom trigger to reopen cookie banner from footer
  useEffect(() => {
    const handleReopen = () => {
      setIsVisible(true);
      setShowSettings(true);
    };
    window.addEventListener('open-cookie-settings', handleReopen);
    return () => window.removeEventListener('open-cookie-settings', handleReopen);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const finalPrefs = {
      ...prefs,
      essential: true,
      timestamp: new Date().toISOString(),
    };
    setPreferences(finalPrefs);
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: '',
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: '',
    });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 md:p-6 flex justify-center pointer-events-none">
      <div className="bg-white dark:bg-slate-900 border-2 border-blue-600/30 dark:border-blue-500/40 rounded-3xl shadow-2xl p-5 sm:p-6 max-w-3xl w-full pointer-events-auto transition-all transform animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'de'
                  ? 'Privatsphäre & Cookie-Einstellungen (§ 25 TDDDG / DSGVO)'
                  : 'Privacy & Cookie Consent (§ 25 TDDDG / GDPR)'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                DSGVO
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {language === 'de'
                ? 'Wir verwenden essenzielle Technologien (z.B. für Warenkorb, Authentifizierung und Stripe-Zahlungssicherheit), die für den Betrieb des Shops zwingend erforderlich sind. Mit Ihrer Zustimmung nutzen wir zudem Cookies für funktionale Verbesserungen und Reichweitenmessung. Sie können Ihre Einwilligung jederzeit widerrufen.'
                : 'We use strictly essential technologies (for shopping cart, authentication, and secure Stripe payment processing). With your permission, we also use cookies to improve features and aggregated performance analytics. You can adjust your choices anytime.'}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px]">
              <button
                onClick={() => onOpenLegalTab('privacy')}
                className="text-blue-600 dark:text-blue-400 underline font-semibold hover:text-blue-800 cursor-pointer"
              >
                {language === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy'}
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                onClick={() => onOpenLegalTab('impressum')}
                className="text-blue-600 dark:text-blue-400 underline font-semibold hover:text-blue-800 cursor-pointer"
              >
                {language === 'de' ? 'Impressum (§ 5 DDG)' : 'Impressum'}
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Granular Settings */}
        {showSettings && (
          <div className="space-y-3 mb-5 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            {/* Essential */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div className="pr-4">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {language === 'de' ? 'Technisch notwendige Cookies (Essenziell)' : 'Strictly Necessary (Essential)'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {language === 'de'
                    ? 'Unverzichtbar für Warenkorb, Benutzeranmeldung und Stripe-Betrugsschutz.'
                    : 'Required for cart session, login credentials, and Stripe security tokens.'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-1 rounded-lg shrink-0">
                {language === 'de' ? 'Immer aktiv' : 'Always Active'}
              </span>
            </div>

            {/* Functional */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div className="pr-4">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {language === 'de' ? 'Funktionale Einstellungen' : 'Functional Preferences'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {language === 'de'
                    ? 'Speichert Sprachauswahl (DE/EN) und Farbschema (Hell/Dunkel).'
                    : 'Remembers language toggle and light/dark theme.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Analytics */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div className="pr-4">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {language === 'de' ? 'Reichweiten- & Performance-Analyse' : 'Performance Analytics'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {language === 'de'
                    ? 'Anonymisierte statistische Erfassung zur kontinuierlichen Verbesserung des Shops.'
                    : 'Anonymized metrics to optimize navigation and loading speeds.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Buttons Bar (Equal visual prominence according to German case law) */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>
              {showSettings
                ? (language === 'de' ? 'Ausblenden' : 'Hide details')
                : (language === 'de' ? 'Einstellungen anpassen' : 'Custom settings')}
            </span>
          </button>

          {showSettings ? (
            <button
              type="button"
              onClick={handleSaveCustom}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === 'de' ? 'Auswahl speichern' : 'Save preferences'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRejectNonEssential}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {language === 'de' ? 'Nur essenzielle akzeptieren' : 'Essential Only'}
            </button>
          )}

          <button
            type="button"
            onClick={handleAcceptAll}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            {language === 'de' ? 'Alle akzeptieren' : 'Accept All'}
          </button>
        </div>
      </div>
    </div>
  );
};
