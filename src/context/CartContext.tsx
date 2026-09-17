import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { storeService } from '../lib/storeService';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  promoCode: string;
  appliedDiscountPercent: number;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate or use a session cart identifier stored in memory
const runtimeCartSessionId = `cart_session_${Math.floor(100000 + Math.random() * 900000)}`;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);
  const [discountFixedAmount, setDiscountFixedAmount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync with Firestore carts collection (No local storage or browser cookies used)
  useEffect(() => {
    storeService.saveCart(runtimeCartSessionId, items, promoCode);
  }, [items, promoCode]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.inventory_count || 99) }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode('');
    setAppliedDiscountPercent(0);
    setDiscountFixedAmount(0);
    storeService.clearCart(runtimeCartSessionId);
  };

  const applyPromoCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const res = await storeService.validateCoupon(code, subtotal);
    if (res.valid) {
      setPromoCode(code.trim().toUpperCase());
      setAppliedDiscountPercent(res.discountPercent);
      if (res.discountAmount > 0 && res.discountPercent === 0) {
        setDiscountFixedAmount(res.discountAmount);
      } else {
        setDiscountFixedAmount(0);
      }
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedDiscountPercent(0);
    setDiscountFixedAmount(0);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  // In German law (PAngV § 1 Abs. 2), consumer prices are gross (Bruttopreise inkl. MwSt.)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  const discountFromPercent = Math.round(((subtotal * appliedDiscountPercent) / 100) * 100) / 100;
  const discount = Math.min(subtotal, discountFromPercent + discountFixedAmount);

  // German standard shipping: DHL Express 4.90 €, free shipping threshold at 40 € or with free shipping voucher
  const isFreeShippingVoucher = promoCode === 'VERSANDFREI' || discountFixedAmount >= 4.9;
  const shippingCost = subtotal >= 40 || items.length === 0 || isFreeShippingVoucher ? 0 : 4.9;
  
  const taxableAmount = Math.max(0, subtotal - discount);
  // Statutory German VAT: 19% Mehrwertsteuer contained within the gross price
  const tax = Math.round((taxableAmount - taxableAmount / 1.19) * 100) / 100;
  const total = Math.round((taxableAmount + shippingCost) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
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
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
