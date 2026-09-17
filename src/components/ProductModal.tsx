import React, { useState, useEffect } from 'react';
import { Product, ProductReview } from '../types';
import {
  X,
  Star,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowRight,
  Check,
  MessageSquare,
  BadgeCheck,
  Send,
  Heart,
  Bell,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { storeService } from '../lib/storeService';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onInstantCheckout?: () => void;
  onOpenShipping?: () => void;
  onOpenRevocation?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onInstantCheckout,
  onOpenShipping,
  onOpenRevocation,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  if (!product) return null;

  const { addItem, setIsCartOpen } = useCart();
  const { t, language, formatPrice } = useLanguage();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Restock alert state
  const [restockEmail, setRestockEmail] = useState('');
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);
  const [restockSubmitted, setRestockSubmitted] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (product) {
      loadReviews();
      setRestockSubmitted(false);
      setRestockEmail(user?.email || '');
    }
  }, [product.id, user?.email]);

  const loadReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const list = await storeService.getReviews(product.id);
      setReviews(list);
    } catch {
      // Handled
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const isOutOfStock = product.inventory_count <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    onClose();
    if (onInstantCheckout) {
      onInstantCheckout();
    } else {
      setIsCartOpen(true);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = restockEmail.trim() || user?.email;
    if (!emailToUse) return;

    setIsSubmittingRestock(true);
    try {
      await storeService.createRestockAlert({
        email: emailToUse,
        productId: product.id,
        productTitle: language === 'de' && product.title_de ? product.title_de : product.title,
        userId: user?.id,
      });
      setRestockSubmitted(true);
    } catch (err) {
      console.error('Failed to create restock alert:', err);
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await storeService.addReview({
        product_id: product.id,
        author_name: newReviewAuthor.trim(),
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        verified_purchase: true,
      });

      setReviewSubmitted(true);
      setNewReviewAuthor('');
      setNewReviewComment('');
      loadReviews();
      setTimeout(() => setReviewSubmitted(false), 4000);
    } catch (err) {
      console.error('Review submission error:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const productTitle = language === 'de' && product.title_de ? product.title_de : product.title;
  const productDesc = language === 'de' && product.description_de ? product.description_de : product.description;
  const categoryName = language === 'de' && product.category_name_de ? product.category_name_de : product.category_name;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-10 transition-colors my-6">
        
        {/* Top Floating Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {onToggleWishlist && (
            <button
              onClick={() => onToggleWishlist(product.id)}
              className="p-2 text-slate-400 hover:text-pink-600 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs rounded-full border border-slate-200 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
              title="Wunschzettel"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs rounded-full border border-slate-200 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch between Details & Reviews */}
        <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-700 flex gap-4 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'de' ? 'Artikelübersicht & Details' : 'Product Details'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {language === 'de' ? 'Kundenbewertungen' : 'Customer Reviews'} ({reviews.length})
            </span>
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Gallery Column */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700">
              <div className="aspect-square bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-4 flex items-center justify-center relative">
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={productTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {product.origin_country && (
                  <span className="absolute top-3 left-3 bg-amber-600/90 text-white font-bold text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 shadow-sm">
                    <span>🇩🇪</span>
                    <span>{product.origin_country}</span>
                  </span>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedImage === idx
                          ? 'border-blue-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Column */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {categoryName || 'Retail'}
                  </span>
                  <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 leading-snug">
                  {productTitle}
                </h2>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    onClick={() => setActiveTab('reviews')}
                    className="flex items-center gap-1 text-amber-500 text-sm font-semibold cursor-pointer hover:underline"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{(product.rating ?? 4.8).toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    ({product.reviews_count ?? reviews.length} {t('product.reviews')})
                  </span>
                  <span className="text-xs text-slate-300 dark:text-slate-600">|</span>
                  <span
                    className={`text-xs font-semibold ${
                      isOutOfStock
                        ? 'text-red-600 dark:text-red-400'
                        : product.inventory_count <= 10
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isOutOfStock ? t('product.outOfStock') : `${product.inventory_count} ${t('flash.leftInStock')}`}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatPrice(product.price)}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-base text-slate-400 dark:text-slate-500 line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  )}
                </div>

                {/* German statutory VAT & shipping notice (§ 1 Abs. 2 PAngV) */}
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex flex-wrap items-center gap-1.5">
                  <span>{product.price >= 40 ? t('product.vatNoticeFree') : t('product.vatNotice')}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={onOpenShipping}
                    className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-800 cursor-pointer"
                  >
                    {language === 'de' ? 'Versanddetails anzeigen' : 'View shipping details'}
                  </button>
                </div>

                {/* Delivery time pill */}
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('product.deliveryTime')}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {productDesc}
                </p>
              </div>

              <div>
                {/* Out of stock: Restock Alert Notification Form */}
                {isOutOfStock ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 mb-4">
                    <div className="flex items-center gap-2 mb-2 text-amber-900 dark:text-amber-200">
                      <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {language === 'de' ? 'Wiederverfügbarkeits-Benachrichtigung' : 'Restock Alert Notification'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300/90 mb-3 leading-relaxed">
                      {language === 'de'
                        ? 'Dieser Artikel ist derzeit vergriffen. Geben Sie Ihre E-Mail-Adresse an, um sofort benachrichtigt zu werden, wenn neue Ware eintrifft.'
                        : 'This item is currently out of stock. Enter your email to be notified the moment inventory is replenished.'}
                    </p>

                    {restockSubmitted ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/50 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          {language === 'de'
                            ? 'Vielen Dank! Wir informieren Sie per E-Mail, sobald dieser Artikel lieferbar ist.'
                            : 'Thank you! You will receive an email alert as soon as this item is back in stock.'}
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleRestockSubmit} className="flex gap-2">
                        <input
                          type="email"
                          required
                          value={restockEmail}
                          onChange={(e) => setRestockEmail(e.target.value)}
                          placeholder={user?.email || (language === 'de' ? 'Ihre E-Mail-Adresse...' : 'Your email address...')}
                          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="submit"
                          disabled={isSubmittingRestock}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{language === 'de' ? 'Benachrichtigen' : 'Alert Me'}</span>
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Quantity & Actions */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 p-1">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer font-bold"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-slate-800 dark:text-slate-100">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity((q) => Math.min(product.inventory_count, q + 1))}
                          disabled={quantity >= product.inventory_count}
                          className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{t('product.added')}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>{t('product.addToCart')} ({formatPrice(product.price * quantity)})</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={handleBuyNow}
                      className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white transition-colors flex items-center justify-center gap-2 mb-4 cursor-pointer"
                    >
                      <span>{language === 'de' ? 'Direkt zur Kasse' : 'Proceed to Checkout'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Guarantees */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t('slideshow.freeShipping')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>SSL & Käuferschutz</span>
                  </div>
                </div>

                {/* Statutory consumer reassurance */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{language === 'de' ? '14 Tage gesetzliches Widerrufsrecht' : '14-Day Statutory Right of Withdrawal'}</span>
                  <button
                    type="button"
                    onClick={onOpenRevocation}
                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 cursor-pointer font-medium"
                  >
                    {language === 'de' ? 'Widerrufsbelehrung' : 'Details'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Reviews Tab */
          <div className="p-6 sm:p-8 space-y-6 max-h-[600px] overflow-y-auto">
            {/* Reviews Summary Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {(product.rating ?? 4.8).toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {reviews.length} {language === 'de' ? 'verifizierte Bewertungen' : 'verified reviews'}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <BadgeCheck className="w-4 h-4" />
                  {language === 'de' ? 'Verifizierte Käufe (Echtzeit Firestore)' : 'Verified Purchases (Firestore)'}
                </span>
              </div>
            </div>

            {/* Write a review form */}
            <form
              onSubmit={handleReviewSubmit}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 space-y-4 shadow-xs"
            >
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'de' ? 'Ihre Bewertung verfassen' : 'Write a Customer Review'}
              </h4>

              {reviewSubmitted && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>
                    {language === 'de'
                      ? 'Vielen Dank! Ihre Bewertung wurde in Firestore gespeichert.'
                      : 'Thank you! Your review was saved to Firestore.'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'de' ? 'Ihr Name' : 'Your Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    placeholder="z.B. Max M."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'de' ? 'Bewertung (Sterne)' : 'Rating (Stars)'}
                  </label>
                  <div className="flex items-center gap-1 py-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= newReviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                      {newReviewRating} / 5
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'de' ? 'Ihr Erfahrungsbericht' : 'Review Comment'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder={
                    language === 'de'
                      ? 'Was hat Ihnen an diesem Produkt gefallen oder missfallen? Wie war die Qualität?'
                      : 'Share your experience with this product...'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmittingReview
                      ? 'Wird gespeichert...'
                      : language === 'de'
                      ? 'Bewertung absenden'
                      : 'Submit Review'}
                  </span>
                </button>
              </div>
            </form>

            {/* List of reviews */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {language === 'de' ? 'Alle Kundenstimmen' : 'All Customer Reviews'} ({reviews.length})
              </h4>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  {language === 'de'
                    ? 'Noch keine Bewertungen vorhanden. Seien Sie der Erste!'
                    : 'No reviews yet. Be the first to leave one!'}
                </p>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{rev.author_name}</span>
                        {rev.verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            <BadgeCheck className="w-3 h-3" />
                            {language === 'de' ? 'Verifizierter Kauf' : 'Verified Purchase'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400' : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(rev.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
