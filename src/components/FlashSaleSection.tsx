import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Zap, Timer, ShoppingBag, Check, Flame, ArrowRight } from 'lucide-react';

interface FlashSaleSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({
  products,
  onSelectProduct,
}) => {
  const { t, language, formatPrice } = useLanguage();
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // 24-hour countdown timer simulating daily Blitzangebote
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 14,
    minutes: 38,
    seconds: 42,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter flash deal products
  const flashProducts = products.filter((p) => p.is_flash_deal || (p.compare_at_price && p.compare_at_price > p.price)).slice(0, 4);

  if (flashProducts.length === 0) return null;

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.inventory_count <= 0) return;
    addItem(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-1 shadow-xl">
        <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 sm:p-8 transition-colors">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                <Zap className="w-7 h-7 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                    {t('flash.title')}
                  </span>
                  <span className="text-xs text-amber-500 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    Hot Deals
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {language === 'de' ? 'Tages-Blitzangebote' : '24-Hour Flash Deals'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('flash.subtitle')}
                </p>
              </div>
            </div>

            {/* Live Countdown Box */}
            <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2.5 rounded-2xl shadow-inner self-start md:self-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <Timer className="w-4 h-4 text-red-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>{t('flash.endsIn')}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono font-black text-sm sm:text-base">
                <span className="bg-slate-800 dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 dark:border-slate-600">
                  {pad(timeLeft.hours)}
                </span>
                <span className="text-red-400">:</span>
                <span className="bg-slate-800 dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 dark:border-slate-600">
                  {pad(timeLeft.minutes)}
                </span>
                <span className="text-red-400">:</span>
                <span className="bg-slate-800 dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 dark:border-slate-600 text-red-400">
                  {pad(timeLeft.seconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Flash Deal Product Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
            {flashProducts.map((product) => {
              const discountPercent = product.compare_at_price
                ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                : (product.flash_deal_discount || 30);

              const isAdded = addedIds[product.id];
              const soldPercent = Math.min(92, Math.max(55, ((product.flash_sold_count || 30) / ((product.flash_sold_count || 30) + product.inventory_count)) * 100));

              const title = language === 'de' && product.title_de ? product.title_de : product.title;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="group bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Discount Badge */}
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 mb-3">
                      <img
                        src={product.images[0]}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="bg-red-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-md shadow-md">
                          -{discountPercent}%
                        </span>
                        {product.origin_country && (
                          <span className="bg-amber-600/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                            <span>🇩🇪</span>
                            <span>DE</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Department / Category */}
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {language === 'de' && product.category_name_de ? product.category_name_de : product.category_name}
                    </span>

                    {/* Title */}
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mt-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {title}
                    </h3>

                    {/* Prices */}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-base font-extrabold text-red-600 dark:text-red-400">
                        {formatPrice(product.price)}
                      </span>
                      {product.compare_at_price && (
                        <span className="text-xs text-slate-600 dark:text-slate-300 line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('product.vatNotice')}
                    </p>

                    {/* Stock Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-700 dark:text-slate-300 mb-1 font-medium">
                        <span>{Math.round(soldPercent)}% {t('flash.claimed')}</span>
                        <span className="text-red-500 font-bold">
                          {product.inventory_count} {t('flash.leftInStock')}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${soldPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={product.inventory_count <= 0}
                    className="w-full mt-4 py-2 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {product.inventory_count <= 0 ? (
                      <span>{t('product.outOfStock')}</span>
                    ) : isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('product.added')}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{t('flash.addToCart')}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
