import React from 'react';
import { Truck, ShieldCheck, Tag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AnnouncementBar: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <div className="bg-blue-900 text-blue-100 text-xs py-2 px-4 border-b border-blue-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Truck className="w-3.5 h-3.5 text-blue-300" />
          <span>
            {t('announcement.freeShipping')}
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-blue-200">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-300" />
            <span>
              {language === 'de' ? (
                <>Gutscheincode <strong className="text-white bg-blue-800 px-1.5 py-0.5 rounded font-mono">BLUE20</strong> für 20% Rabatt</>
              ) : (
                <>Use code <strong className="text-white bg-blue-800 px-1.5 py-0.5 rounded font-mono">BLUE20</strong> for 20% off</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            <span>{t('announcement.stripeSecurity')}</span>
          </div>
        </div>
        <div className="text-xs text-blue-200 mx-auto sm:mx-0">
          <span>{t('announcement.trackOrders')}</span>
        </div>
      </div>
    </div>
  );
};
