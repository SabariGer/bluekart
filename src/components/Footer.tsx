import React from 'react';
import { ShoppingBag, ShieldCheck, Truck, Headphones, HelpCircle, Mail, Phone, FileText, CheckCircle, RotateCcw, Scale, Recycle, Cookie } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LegalTab } from './LegalModal';

interface FooterProps {
  onOpenTracker: () => void;
  onOpenOrders: () => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
  onOpenLegalTab?: (tab: LegalTab) => void;
  onOpenReturns?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTracker,
  onOpenOrders,
  isAdmin = false,
  onOpenAdmin,
  onOpenLegalTab,
  onOpenReturns,
}) => {
  const { t, language } = useLanguage();

  const handleOpenLegal = (tab: LegalTab) => {
    if (onOpenLegalTab) {
      onOpenLegalTab(tab);
    }
  };

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-settings'));
  };

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 text-xs border-t border-slate-800 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Blue<span className="text-blue-500">Cart</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {t('footer.aboutDesc')}
            </p>
            <div className="flex items-center gap-2 text-slate-300 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium">
                {language === 'de' ? 'Stripe SSL Verschlüsselung aktiv' : 'Stripe SSL 256-bit Encrypted'}
              </span>
            </div>
            <div className="pt-2">
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-medium">
                ⭐ 4.9/5 ({language === 'de' ? 'über 2.400 verifizierte Bewertungen' : '2,400+ verified customer reviews'})
              </span>
            </div>
          </div>

          {/* Customer Support & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('footer.service')}</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={onOpenTracker}
                  className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1.5 text-slate-300"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('nav.trackOrder')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenOrders}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-slate-300"
                >
                  {language === 'de' ? 'Meine Bestellungen' : 'My Order History'}
                </button>
              </li>
              {onOpenReturns && (
                <li>
                  <button
                    onClick={onOpenReturns}
                    className="hover:text-amber-400 transition-colors cursor-pointer text-slate-300 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-400" />
                    <span>{language === 'de' ? '14-Tage Retourenportal' : '14-Day Returns'}</span>
                  </button>
                </li>
              )}
              <li className="flex items-center gap-1.5 text-slate-400">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>support@bluecart.store</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>+49 (0) 89 244-1188 (Mo-Fr 08-18 Uhr)</span>
              </li>
            </ul>
          </div>

          {/* Shipping & Delivery Information */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('footer.shippingInfo')}</span>
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'de' ? 'DHL Express (1–3 Werktage)' : 'DHL Express (1–3 Business Days)'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'de' ? 'Kostenloser Versand ab 50 €' : 'Free Express Shipping from 50 €'}</span>
              </li>
              <li>
                <button
                  onClick={() => handleOpenLegal('shipping')}
                  className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1 text-slate-300"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{language === 'de' ? 'Versand & MwSt. Details (§ 1 PAngV)' : 'Shipping & VAT Info (PAngV)'}</span>
                </button>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span>🌱 {language === 'de' ? 'Klimaneutraler Versand mit DHL GoGreen' : 'Carbon-neutral shipping via GoGreen'}</span>
              </li>
            </ul>
          </div>

          {/* German Legal Compliance (§ 5 DDG, DSGVO, AGB, Widerruf) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('footer.legal')}</span>
            </h4>
            <ul className="space-y-2 text-slate-400 mb-4">
              <li>
                <button
                  onClick={() => handleOpenLegal('impressum')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>{t('footer.impressum')}</span>
                  <span className="text-[10px] text-slate-500 font-mono">(§ 5 DDG)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenLegal('privacy')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>{t('footer.privacy')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenLegal('terms')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>{t('footer.terms')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenLegal('revocation')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left text-blue-400 hover:underline flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3 shrink-0" />
                  <span>{t('footer.revocation')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenLegal('battery')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left flex items-center gap-1.5 text-xs text-slate-400"
                >
                  <Recycle className="w-3 h-3 shrink-0" />
                  <span>{t('footer.battery')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleOpenCookieSettings}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left flex items-center gap-1.5 text-xs text-slate-400"
                >
                  <Cookie className="w-3 h-3 shrink-0 text-amber-400" />
                  <span>{t('footer.cookies')}</span>
                </button>
              </li>
            </ul>

            {/* Admin link if user is administrator */}
            {isAdmin && onOpenAdmin && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={onOpenAdmin}
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold cursor-pointer text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('nav.adminDashboard')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Bar */}
        <div className="pt-6 pb-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">
              {t('footer.paymentMethods')}:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-1 bg-slate-800 text-slate-200 font-bold rounded text-[10px] border border-slate-700">
                Stripe
              </span>
              <span className="px-2 py-1 bg-pink-950 text-pink-300 font-bold rounded text-[10px] border border-pink-800">
                Klarna
              </span>
              <span className="px-2 py-1 bg-blue-950 text-blue-300 font-bold rounded text-[10px] border border-blue-800">
                PayPal
              </span>
              <span className="px-2 py-1 bg-slate-800 text-slate-200 font-bold rounded text-[10px] border border-slate-700">
                Visa / Mastercard
              </span>
              <span className="px-2 py-1 bg-slate-800 text-slate-200 font-bold rounded text-[10px] border border-slate-700">
                SEPA
              </span>
              <span className="px-2 py-1 bg-slate-800 text-slate-200 font-bold rounded text-[10px] border border-slate-700">
                Apple Pay
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            {language === 'de' ? (
              <span>Gutscheincode: <strong className="text-blue-400 font-mono">BLUE20</strong> für 20% Sofortrabatt</span>
            ) : (
              <span>Promo code: <strong className="text-blue-400 font-mono">BLUE20</strong> for 20% off at checkout</span>
            )}
          </div>
        </div>

        {/* Bottom copyright & statutory OS Platform link */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© 2026 BlueCart Retail GmbH. {t('footer.rights')}</p>
          <div className="flex items-center gap-3">
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 underline"
            >
              OS-Plattform (EU-Streitschlichtung)
            </a>
            <span>•</span>
            <span className="text-slate-500">
              {language === 'de' ? 'München • Berlin • Solingen' : 'Munich • Berlin • Solingen'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
