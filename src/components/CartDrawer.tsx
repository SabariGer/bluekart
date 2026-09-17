import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Truck, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal,
    tax,
    shippingCost,
    discount,
    total,
    promoCode,
    appliedDiscountPercent,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const { t, language, formatPrice } = useLanguage();
  const [inputCode, setInputCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode) return;
    const res = applyPromoCode(inputCode);
    setPromoMessage({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const freeShippingThreshold = 50;
  const amountUntilFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-colors border-l border-slate-200 dark:border-slate-800">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('cart.title')}
              </h2>
              <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          <div className="bg-blue-50/80 dark:bg-blue-950/40 px-5 py-3 border-b border-blue-100 dark:border-blue-900 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-blue-900 dark:text-blue-200 font-medium">
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              {amountUntilFreeShipping > 0 ? (
                <span>
                  {language === 'de' ? (
                    <>Noch <strong className="text-blue-700 dark:text-blue-300">{formatPrice(amountUntilFreeShipping)}</strong> für <strong>kostenlosen Versand</strong>!</>
                  ) : (
                    <>Add <strong className="text-blue-700 dark:text-blue-300">{formatPrice(amountUntilFreeShipping)}</strong> more for <strong>FREE shipping</strong>!</>
                  )}
                </span>
              ) : (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  🎉 {language === 'de' ? 'Kostenloser Expressversand freigeschaltet!' : 'You unlocked FREE Express Delivery!'}
                </span>
              )}
            </div>
            <div className="w-full bg-blue-200/60 dark:bg-blue-900/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-500 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {t('cart.empty')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                  {language === 'de'
                    ? 'Ihr Warenkorb ist leer. Entdecken Sie unsere neuen Kollektionen.'
                    : "Looks like you haven't added anything to your cart yet. Explore our top retail collections."}
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {language === 'de' ? 'Jetzt einkaufen' : 'Start Shopping'}
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const productTitle = language === 'de' && product.title_de ? product.title_de : product.title;

                return (
                  <div
                    key={product.id}
                    className="flex gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                      <img
                        src={product.images[0]}
                        alt={productTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {product.origin_country && (
                        <span className="absolute top-1 left-1 bg-amber-600/90 text-white text-[9px] font-bold px-1 rounded">
                          DE
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                            {productTitle}
                          </h4>
                          <button
                            onClick={() => removeItem(product.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-0.5"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">SKU: {product.sku}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors text-xs font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.inventory_count}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors text-xs font-bold cursor-pointer disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {formatPrice(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-4">
              {/* Promo Code Input */}
              <div>
                {promoCode ? (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
                      <Tag className="w-4 h-4" />
                      <span>{promoCode} ({appliedDiscountPercent}% {t('cart.discount')})</span>
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="text-slate-400 hover:text-red-600 text-xs font-medium cursor-pointer"
                    >
                      {language === 'de' ? 'Entfernen' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCode} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={language === 'de' ? 'Rabattcode (z.B. BLUE20)' : 'Discount code (try BLUE20)'}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-600 outline-none uppercase font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      {language === 'de' ? 'Einlösen' : 'Apply'}
                    </button>
                  </form>
                )}

                {promoMessage && !promoCode && (
                  <p
                    className={`text-[11px] mt-1.5 ${
                      promoMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Order Summary Calculations */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>{t('cart.discount')} ({promoCode})</span>
                    <span className="font-semibold">-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{t('cart.shipping')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px]">
                        {language === 'de' ? 'KOSTENLOS (ab 50 €)' : 'FREE (from 50 €)'}
                      </span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px] pt-0.5">
                  <span>{t('cart.tax')}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{formatPrice(tax)}</span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                  <span>{t('cart.total')}</span>
                  <span className="text-base text-blue-600 dark:text-blue-400 font-black">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('cart.checkoutBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Stripe SSL Encrypted Checkout & Package Tracking</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
