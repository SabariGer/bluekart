import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Heart, ShoppingBag, Trash2, X, ArrowRight } from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistIds: string[];
  products: Product[];
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistIds,
  products,
  onToggleWishlist,
  onOpenProduct,
}) => {
  const { addItem } = useCart();
  const { language, formatPrice } = useLanguage();

  if (!isOpen) return null;

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-transform">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-pink-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'de' ? 'Wunschzettel' : 'My Wishlist'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {wishlistProducts.length} {language === 'de' ? 'gespeicherte Artikel' : 'saved items'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {wishlistProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Heart className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {language === 'de' ? 'Ihr Wunschzettel ist noch leer' : 'Your wishlist is empty'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {language === 'de'
                  ? 'Klicken Sie auf das Herz-Symbol bei einem Produkt, um es für später zu speichern.'
                  : 'Click the heart icon on any product to bookmark it for later.'}
              </p>
            </div>
          ) : (
            wishlistProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3 items-center group hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <img
                  src={prod.images[0]}
                  alt={prod.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-cover rounded-lg bg-slate-200 cursor-pointer"
                  onClick={() => {
                    onOpenProduct(prod);
                    onClose();
                  }}
                />

                <div className="flex-1 min-w-0">
                  <h4
                    onClick={() => {
                      onOpenProduct(prod);
                      onClose();
                    }}
                    className="text-xs font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600"
                  >
                    {language === 'de' && prod.title_de ? prod.title_de : prod.title}
                  </h4>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatPrice(prod.price)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {prod.inventory_count > 0 ? (
                      <span className="text-emerald-600 font-medium">Auf Lager</span>
                    ) : (
                      <span className="text-red-500 font-medium">Ausverkauft</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 items-end">
                  <button
                    onClick={() => {
                      addItem(prod, 1);
                    }}
                    disabled={prod.inventory_count <= 0}
                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                    title={language === 'de' ? 'In den Warenkorb' : 'Add to cart'}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onToggleWishlist(prod.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title={language === 'de' ? 'Entfernen' : 'Remove'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlistProducts.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
            <button
              onClick={() => {
                wishlistProducts.forEach((p) => {
                  if (p.inventory_count > 0) addItem(p, 1);
                });
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{language === 'de' ? 'Alle verfügbaren in den Warenkorb' : 'Add all available to cart'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
