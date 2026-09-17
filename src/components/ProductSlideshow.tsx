import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface ProductSlideshowProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onFilterCategory?: (categoryId: string) => void;
}

export const ProductSlideshow: React.FC<ProductSlideshowProps> = ({
  products,
  onSelectProduct,
  onFilterCategory,
}) => {
  const { t, language, formatPrice } = useLanguage();
  const { addItem } = useCart();

  // Find 4 top highlighted products (or fallback)
  const featuredSlides = products.filter(
    (p) => p.featured_badge || p.is_flash_deal || p.origin_country
  ).slice(0, 4);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Auto advance every 5 seconds
  useEffect(() => {
    if (isPaused || featuredSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, featuredSlides.length]);

  if (featuredSlides.length === 0) return null;

  const currentProduct = featuredSlides[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredSlides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length);
  };

  const isOutOfStock = currentProduct.inventory_count <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(currentProduct);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const productTitle = language === 'de' && currentProduct.title_de
    ? currentProduct.title_de
    : currentProduct.title;

  const productDesc = language === 'de' && currentProduct.description_de
    ? currentProduct.description_de
    : currentProduct.description;

  const discountPercent = currentProduct.compare_at_price
    ? Math.round(((currentProduct.compare_at_price - currentProduct.price) / currentProduct.compare_at_price) * 100)
    : null;

  return (
    <div
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 dark:from-amber-500 dark:via-yellow-500 dark:to-amber-600 text-slate-900 shadow-xl border border-yellow-300 dark:border-amber-400/50">
        {/* Subtle background ambiance */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-amber-300/50 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[360px] md:min-h-[400px]">
          {/* Left Text / Info Panel */}
          <div className="md:col-span-7 p-6 sm:p-10 z-10 flex flex-col justify-center">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {currentProduct.origin_country && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-amber-300 border border-slate-800 shadow-xs">
                  <span>🇩🇪</span>
                  <span>{currentProduct.origin_country}</span>
                </span>
              )}
              {currentProduct.featured_badge && (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white border border-slate-800 uppercase tracking-wide shadow-xs">
                  {currentProduct.featured_badge}
                </span>
              )}
              {discountPercent && (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-600 text-white border border-red-700 shadow-xs">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Product Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950 line-clamp-2 mb-3">
              {productTitle}
            </h2>

            {/* Description */}
            <p className="text-slate-800 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-6 max-w-xl font-medium">
              {productDesc}
            </p>

            {/* Price block & CTA buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-950 tracking-tight">
                    {formatPrice(currentProduct.price)}
                  </span>
                  {currentProduct.compare_at_price && (
                    <span className="text-base text-slate-700 font-semibold line-through">
                      {formatPrice(currentProduct.compare_at_price)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-700 font-medium mt-0.5">
                  {t('product.vatNotice')}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={isOutOfStock}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  {isOutOfStock ? (
                    <span>{t('product.outOfStock')}</span>
                  ) : justAdded ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{t('product.added')}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{t('product.addToCart')}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectProduct(currentProduct)}
                  className="px-4 py-2.5 bg-slate-900/10 hover:bg-slate-900/20 text-slate-950 border border-slate-900/20 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{t('product.quickView')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-4 mt-6 text-[11px] text-slate-800 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                <span>{t('slideshow.freeShipping')}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-950 font-bold">★ {currentProduct.rating}</span>
                <span>({currentProduct.reviews_count} {t('product.reviews')})</span>
              </div>
            </div>
          </div>

          {/* Right Product Image Showcase */}
          <div className="md:col-span-5 p-6 flex items-center justify-center relative">
            <div
              onClick={() => onSelectProduct(currentProduct)}
              className="group cursor-pointer relative w-full max-w-xs sm:max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-900/15 bg-white"
            >
              <img
                src={currentProduct.images[0]}
                alt={productTitle}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-xs font-bold text-white bg-slate-900/90 px-3 py-1 rounded-lg">
                  {t('slideshow.viewDeal')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Prev / Next Controls */}
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer shadow-md z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer shadow-md z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {featuredSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'w-7 bg-slate-900'
                  : 'w-2 bg-slate-900/30 hover:bg-slate-900/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
