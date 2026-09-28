import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { ProductSlideshow } from './components/ProductSlideshow';
import { FlashSaleSection } from './components/FlashSaleSection';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { InvoiceModal } from './components/InvoiceModal';
import { ReturnsPortalModal } from './components/ReturnsPortalModal';
import { DeliveryTracker } from './components/DeliveryTracker';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { CookieBanner } from './components/CookieBanner';
import { Footer } from './components/Footer';
import { LoginPage } from './components/LoginPage';
import { UserProfileModal } from './components/UserProfileModal';
import { storeService } from './lib/storeService';
import { Product, Category, Order } from './types';
import {
  Package,
  ArrowUpDown,
  Search,
} from 'lucide-react';

function StoreMain() {
  const { user, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { language, t } = useLanguage();
  const { isDark } = useTheme();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [activeTab, setActiveTab] = useState<'store' | 'tracker'>('store');

  // Modal & Drawer states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [isReturnsOpen, setIsReturnsOpen] = useState(false);
  const [returnsInitialOrder, setReturnsInitialOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTab>('impressum');

  const handleOpenLegalTab = (tab: LegalTab) => {
    setLegalInitialTab(tab);
    setIsLegalOpen(true);
  };

  useEffect(() => {
    if (user) {
      loadStoreData();
      loadWishlist();
      const unsub = storeService.subscribeToOrders((newOrders) => {
        setOrders(newOrders);
      });
      return () => unsub();
    }
  }, [user]);

  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats, ords] = await Promise.all([
        storeService.getProducts(),
        storeService.getCategories(),
        storeService.getOrders(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setOrders(ords);
    } catch (err) {
      console.error('Error loading store data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWishlist = async () => {
    if (!user) {
      setWishlistIds([]);
      return;
    }
    try {
      const ids = await storeService.getWishlist(user.id);
      setWishlistIds(ids || []);
    } catch (err) {
      console.error('Error loading wishlist:', err);
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    const isCurrently = wishlistIds.includes(productId);
    // Optimistic UI
    setWishlistIds((prev) =>
      isCurrently ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    try {
      const updated = await storeService.toggleWishlist(user.id, productId);
      setWishlistIds(updated);
    } catch (err) {
      console.error('Error toggling wishlist item:', err);
      loadWishlist();
    }
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedInvoiceOrder(order);
    setIsInvoiceOpen(true);
  };

  const handleOpenReturns = (order?: Order) => {
    setReturnsInitialOrder(order || null);
    setIsReturnsOpen(true);
  };

  // Auth gate: Show loading screen while checking session
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading BlueCart Store...</p>
        </div>
      </div>
    );
  }

  // Auth gate: Require login first before accessing store catalog
  if (!user) {
    return <LoginPage />;
  }

  // Filter & Sort products with German search support
  const filteredProducts = products
    .filter((product) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) {
        return selectedCategory ? product.category_id === selectedCategory : true;
      }

      const matchesTitleEn = product.title.toLowerCase().includes(q);
      const matchesTitleDe = product.title_de?.toLowerCase().includes(q) || false;
      const matchesDescEn = product.description.toLowerCase().includes(q);
      const matchesDescDe = product.description_de?.toLowerCase().includes(q) || false;
      const matchesSku = product.sku.toLowerCase().includes(q);
      const matchesOrigin = product.origin_country?.toLowerCase().includes(q) || false;

      const matchesSearch = matchesTitleEn || matchesTitleDe || matchesDescEn || matchesDescDe || matchesSku || matchesOrigin;
      const matchesCategory = selectedCategory ? product.category_id === selectedCategory : true;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // featured default
    });

  const handleOrderSuccess = (order: Order) => {
    setTrackedOrder(order);
    setActiveTab('tracker');
    loadStoreData();
  };

  const handleTrackSpecificOrder = (order: Order) => {
    setTrackedOrder(order);
    setActiveTab('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const selectedCategoryName = selectedCategoryObj
    ? (language === 'de' && selectedCategoryObj.name_de ? selectedCategoryObj.name_de : selectedCategoryObj.name)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Banner */}
      <AnnouncementBar />

      {/* Main Navbar with Language, Dark/Light Switchers, and Wishlist */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenTracker={() => {
          setActiveTab('tracker');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={() => {
          if (isAdmin) setIsAdminOpen(true);
        }}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenReturns={() => handleOpenReturns()}
        wishlistCount={wishlistIds.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCategory={(id) => {
          setSelectedCategory(id);
          setActiveTab('store');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Tracker View */}
        {activeTab === 'tracker' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveTab('store')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← {language === 'de' ? 'Zurück zum Sortiment' : 'Back to Retail Catalog'}
              </button>
            </div>
            <DeliveryTracker
              initialOrder={trackedOrder}
              onClose={() => setActiveTab('store')}
            />
          </div>
        ) : (
          /* Storefront View */
          <>
            {/* Product Slideshow Below Header */}
            {!selectedCategory && !searchQuery && products.length > 0 && (
              <ProductSlideshow
                products={products}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onFilterCategory={(catId) => setSelectedCategory(catId)}
              />
            )}

            {/* Flash Sale / Blitzangebote with Countdown */}
            {!selectedCategory && !searchQuery && products.length > 0 && (
              <FlashSaleSection
                products={products}
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            )}

            {/* Department Categories Filter Bar */}
            <CategoryBar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              totalProductsCount={products.length}
            />

            {/* Catalog Grid Header & Sorting Controls */}
            <div id="catalog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>
                      {selectedCategoryName
                        ? selectedCategoryName
                        : searchQuery
                        ? `${language === 'de' ? 'Suchergebnisse für' : 'Search Results for'} "${searchQuery}"`
                        : (language === 'de' ? 'Ausgewählte Kollektion' : 'Featured Collection')}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {filteredProducts.length} {language === 'de' ? 'Artikel' : 'items'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {searchQuery
                      ? (language === 'de' ? 'Passende Produkte in allen Abteilungen' : 'Matching products across all store departments')
                      : (language === 'de' ? 'Alle Artikel mit DHL Express & Stripe Zahlungsgarantie' : 'All items include express shipping & Stripe payment guarantee')}
                  </p>
                </div>

                {/* Sort & Quick Filter */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-slate-400">{t('category.sort')}:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="font-semibold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="featured" className="dark:bg-slate-800">{t('category.sortFeatured')}</option>
                      <option value="price-asc" className="dark:bg-slate-800">{t('category.sortPriceLow')}</option>
                      <option value="price-desc" className="dark:bg-slate-800">{t('category.sortPriceHigh')}</option>
                      <option value="rating" className="dark:bg-slate-800">{t('category.sortRating')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
              {isLoading ? (
                <div className="py-24 text-center">
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-medium">
                    {language === 'de' ? 'Lade Sortiment...' : 'Loading retail store inventory...'}
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center max-w-lg mx-auto shadow-xs">
                  <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {language === 'de' ? 'Keine Produkte gefunden' : 'No products found'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {language === 'de'
                      ? 'Keine passenden Artikel gefunden. Bitte Filter oder Suchbegriff anpassen.'
                      : "We couldn't find any items matching your filter. Try adjusting your search query or department."}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {language === 'de' ? 'Alle Filter zurücksetzen' : 'Reset All Filters'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={wishlistIds.includes(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onOpenDetails={(p) => setSelectedProduct(p)}
                      onOpenShippingInfo={() => handleOpenLegalTab('shipping')}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistIds={wishlistIds}
        products={products}
        onToggleWishlist={handleToggleWishlist}
        onOpenProduct={(p) => {
          setSelectedProduct(p);
          setIsWishlistOpen(false);
        }}
      />

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onInstantCheckout={() => setIsCheckoutOpen(true)}
        onOpenShipping={() => handleOpenLegalTab('shipping')}
        onOpenRevocation={() => handleOpenLegalTab('revocation')}
      />

      {/* Stripe Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        onOpenLegalTab={handleOpenLegalTab}
        onViewInvoice={handleViewInvoice}
      />

      {/* Statutory Invoice Modal (§ 14 UStG) */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={selectedInvoiceOrder}
      />

      {/* Customer Returns Portal Modal (14 Tage Widerruf § 355 BGB) */}
      <ReturnsPortalModal
        isOpen={isReturnsOpen}
        onClose={() => setIsReturnsOpen(false)}
        orders={orders}
        customerEmail={user?.email || 'karthylock@gmail.com'}
        initialOrder={returnsInitialOrder}
        onReturnCreated={() => loadStoreData()}
      />

      {/* Customer Orders & Tracking History Modal */}
      <CustomerOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        onTrackOrder={handleTrackSpecificOrder}
        onViewInvoice={handleViewInvoice}
        onOpenReturns={handleOpenReturns}
      />

      {/* Legal & Compliance Modal (Impressum, AGB, Widerruf, Datenschutz, PAngV, BatterieG) */}
      <LegalModal
        isOpen={isLegalOpen}
        initialTab={legalInitialTab}
        onClose={() => setIsLegalOpen(false)}
      />

      {/* GDPR / TDDDG Cookie Consent Banner with granular preferences */}
      <CookieBanner
        onOpenLegalTab={handleOpenLegalTab}
      />

      {/* Admin Dashboard - Strict Admin Only Guard */}
      {isAdminOpen && isAdmin && (
        <AdminDashboard
          onClose={() => setIsAdminOpen(false)}
          onRefreshData={loadStoreData}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Customer European Profile & WhatsApp Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenReturns={() => handleOpenReturns()}
      />

      {/* Footer with statutory German links & ODR dispute platform */}
      <Footer
        onOpenTracker={() => {
          setActiveTab('tracker');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenReturns={() => handleOpenReturns()}
        isAdmin={isAdmin}
        onOpenAdmin={() => {
          if (isAdmin) setIsAdminOpen(true);
        }}
        onOpenLegalTab={handleOpenLegalTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <StoreMain />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
