import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  Shield,
  Package,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Sun,
  Moon,
  Heart,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenOrders: () => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  onOpenWishlist?: () => void;
  onOpenReturns?: () => void;
  wishlistCount?: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectCategory: (categoryId: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenProfile,
  onOpenOrders,
  onOpenTracker,
  onOpenAdmin,
  onOpenWishlist,
  onOpenReturns,
  wishlistCount = 0,
  searchQuery,
  onSearchChange,
  onSelectCategory,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => {
                onSelectCategory(null);
                onSearchChange('');
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs group-hover:shadow-md group-hover:scale-105 transition-all">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white block leading-tight">
                  Blue<span className="text-blue-600 dark:text-blue-400">Cart</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  {language === 'de' ? 'Offizieller Store • Firestore' : 'Official Retail Store'}
                </span>
              </div>
            </button>

            {/* Quick Desktop Links */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => {
                  onSelectCategory(null);
                  onSearchChange('');
                }}
                className="px-3 py-1.5 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('nav.allProducts')}
              </button>
              <button
                onClick={onOpenTracker}
                className="px-3 py-1.5 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t('nav.trackOrder')}</span>
              </button>
              {onOpenReturns && (
                <button
                  onClick={onOpenReturns}
                  className="px-3 py-1.5 rounded-lg hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{language === 'de' ? '14-Tage Retoure' : 'Returns'}</span>
                </button>
              )}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-full text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: Wishlist, Language, Theme, Cart, Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Wishlist Button */}
            {onOpenWishlist && (
              <button
                onClick={onOpenWishlist}
                className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title={language === 'de' ? 'Wunschzettel ansehen' : 'View wishlist'}
              >
                <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-pink-500 text-pink-500' : ''}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}

            {/* Language Switcher Pill */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setLanguage('en')}
                title="English"
                className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🇬🇧</span>
                <span className="hidden sm:inline">EN</span>
              </button>
              <button
                onClick={() => setLanguage('de')}
                title="Deutsch"
                className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  language === 'de'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🇩🇪</span>
                <span className="hidden sm:inline">DE</span>
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Admin Dashboard Direct Button */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t('nav.adminDashboard')}</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="hidden xl:block text-left pr-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[100px]">
                      {user.name}
                    </p>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t('nav.signIn')}</span>
                </button>
              )}

              {/* User Dropdown */}
              {isUserMenuOpen && user && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 text-xs text-slate-700 dark:text-slate-300">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {user.role} Account
                      </span>
                    </div>

                    <div className="py-1">
                      {onOpenProfile && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenProfile();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{language === 'de' ? 'Mein Profil & WhatsApp' : 'My Profile & WhatsApp'}</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                            {user.whatsapp_country_code || 'EU'}
                          </span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            {t('nav.adminDashboard')}
                          </span>
                          <ArrowRight className="w-3 h-3 text-blue-500" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenOrders();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-500" />
                          <span>{language === 'de' ? 'Meine Bestellungen & Rechnungen' : 'My Orders & Invoices'}</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>

                      {onOpenReturns && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenReturns();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-amber-500" />
                            <span>{language === 'de' ? '14-Tage Retourenportal' : 'Returns Portal'}</span>
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      )}

                      {onOpenWishlist && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenWishlist();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <span>{language === 'de' ? 'Wunschzettel' : 'Wishlist'} ({wishlistCount})</span>
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      )}

                      <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await logout();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav.signOut')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs outline-hidden"
            />
          </div>
          {onOpenProfile && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="w-full text-left py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>{language === 'de' ? 'Mein Profil & WhatsApp' : 'My Profile & WhatsApp'}</span>
            </button>
          )}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onSelectCategory(null);
            }}
            className="w-full text-left py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            {t('nav.allProducts')}
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenTracker();
            }}
            className="w-full text-left py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"
          >
            <Package className="w-4 h-4 text-blue-600" />
            <span>{t('nav.trackOrder')}</span>
          </button>
          {onOpenReturns && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenReturns();
              }}
              className="w-full text-left py-2 text-xs font-semibold text-amber-600 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'de' ? '14-Tage Retourenportal' : 'Returns Portal'}</span>
            </button>
          )}
          {onOpenWishlist && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenWishlist();
              }}
              className="w-full text-left py-2 text-xs font-semibold text-pink-600 flex items-center gap-2"
            >
              <Heart className="w-4 h-4 fill-pink-500" />
              <span>{language === 'de' ? 'Wunschzettel' : 'Wishlist'} ({wishlistCount})</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
