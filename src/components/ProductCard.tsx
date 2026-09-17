import React, { useState } from 'react';
import { Product } from '../types';
import { Star, ShoppingBag, Check, Eye, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onOpenShippingInfo?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onOpenShippingInfo,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const { addItem } = useCart();
  const { t, language, formatPrice } = useLanguage();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.inventory_count <= 0) return;
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  const discountPercent = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : product.flash_deal_discount || 0;

  const isLowStock = product.inventory_count > 0 && product.inventory_count <= 10;
  const isOutOfStock = product.inventory_count <= 0;

  const productTitle = language === 'de' && product.title_de ? product.title_de : product.title;
  const categoryName = language === 'de' && product.category_name_de ? product.category_name_de : product.category_name;

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-750 overflow-hidden hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 flex flex-col cursor-pointer relative"
    >
      {/* Product Image Frame */}
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
          alt={productTitle}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Origin / Special badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {product.origin_country && (
            <span className="bg-amber-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <span>🇩🇪</span>
              <span>{product.origin_country}</span>
            </span>
          )}
          {product.featured_badge && (
            <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider shadow-xs">
              {product.featured_badge}
            </span>
          )}
        </div>

        {/* Right Corner: Discount & Wishlist */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 z-10">
          {onToggleWishlist && (
            <button
              onClick={handleWishlistClick}
              className={`p-1.5 rounded-full backdrop-blur-xs border transition-transform hover:scale-110 shadow-xs cursor-pointer ${
                isWishlisted
                  ? 'bg-white text-pink-600 border-pink-200'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-pink-600 border-slate-200/60 dark:border-slate-700'
              }`}
              title={isWishlisted ? 'Aus Wunschzettel entfernen' : 'Auf Wunschzettel speichern'}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>
          )}

          {discountPercent > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Quick View Hover Pill */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-slate-900/85 backdrop-blur-xs text-white text-xs font-semibold py-1 px-3 rounded-full flex items-center gap-1.5 shadow-md">
            <Eye className="w-3.5 h-3.5" />
            <span>{t('product.quickView')}</span>
          </span>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {categoryName || 'Retail'}
            </span>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{(product.rating ?? 4.8).toFixed(1)}</span>
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">({product.reviews_count ?? 0})</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
            {productTitle}
          </h3>
        </div>

        {/* Pricing & Stock & Add Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>

          {/* German statutory VAT & shipping notice (§ 1 Abs. 2 PAngV) */}
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 mt-0.5 leading-tight flex flex-wrap items-center gap-1">
            <span>{product.price >= 40 ? t('product.vatNoticeFree') : t('product.vatNotice')}</span>
            {product.price < 40 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenShippingInfo) onOpenShippingInfo();
                }}
                className="underline hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
              >
                ({language === 'de' ? '4,90 € DHL' : '€4.90 DHL'})
              </button>
            )}
          </div>

          {/* Delivery time notice (Lieferzeit gemäß BGB / PAngV) */}
          <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
            <span>📦</span>
            <span>{t('product.deliveryTime')}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Stock status indicator */}
            <span
              className={`text-[11px] font-medium ${
                isOutOfStock
                  ? 'text-red-600 dark:text-red-400'
                  : isLowStock
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {isOutOfStock
                ? t('product.outOfStock')
                : isLowStock
                ? `${t('product.onlyLeft')} ${product.inventory_count}`
                : t('product.inStock')}
            </span>

            {/* Add to Cart button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : isAdded
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('product.added')}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isOutOfStock ? t('product.outOfStock') : t('product.addToCart')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
