import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Category,
  Product,
  Order,
  OrderStatus,
  DeliveryEvent,
  RevenueAnalytics,
  ItemSalesMetric,
  ProductReview,
  ReturnRequest,
  Coupon,
  RestockAlert,
  UserProfile,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS } from '../data/seedData';

// Firestore collection names
const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  WISHLISTS: 'wishlists',
  RETURNS: 'returns',
  COUPONS: 'coupons',
  CARTS: 'carts',
  RESTOCK_ALERTS: 'restock_alerts',
};

// In-memory runtime caches for snappy optimistic updates
let cachedProducts: Product[] = [];
let cachedCategories: Category[] = [];
let cachedOrders: Order[] = [];
let isSeeding = false;

// Default starter coupons
const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup_1',
    code: 'WILLKOMMEN10',
    discount_percent: 10,
    min_amount: 20,
    description: '10% Willkommensrabatt ab 20€ Bestellwert',
    description_de: '10% Willkommensrabatt ab 20€ Bestellwert',
    is_active: true,
  },
  {
    id: 'coup_2',
    code: 'HERBST15',
    discount_percent: 15,
    min_amount: 50,
    description: '15% Saison-Rabatt ab 50€ Bestellwert',
    description_de: '15% Saison-Rabatt ab 50€ Bestellwert',
    is_active: true,
  },
  {
    id: 'coup_3',
    code: 'VERSANDFREI',
    discount_percent: 100, // Shipping discount handled dynamically
    min_amount: 25,
    description: 'Kostenloser Versand ab 25€',
    description_de: 'Kostenloser Versand ab 25€',
    is_active: true,
  },
];

// Default starter returns for demonstration
const INITIAL_RETURNS: ReturnRequest[] = [
  {
    id: 'ret_sample_1',
    order_id: 'ord_1',
    order_number: 'BC-2026-8912',
    customer_email: 'max.mustermann@gmail.com',
    carrier: 'DHL',
    tracking_number: '003404341928472918',
    reason: 'Widerruf § 355 BGB (14-tägiges Rückgaberecht)',
    status: 'requested',
    items: [
      {
        product_id: 'prod_1',
        title: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
        quantity: 1,
        price: 349.0,
      },
    ],
    rma_code: 'RMA-DE-829104',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    return_label_url: 'https://dhl.de/retoure/RMA-DE-829104',
  },
  {
    id: 'ret_sample_2',
    order_id: 'ord_2',
    order_number: 'BC-2026-7841',
    customer_email: 'anna.schmidt@web.de',
    carrier: 'Hermes',
    tracking_number: 'H10293847561029',
    reason: 'Falsche Größe / Nicht passend',
    status: 'in_transit',
    items: [
      {
        product_id: 'prod_2',
        title: 'Minimalist Heavyweight Hoodie',
        quantity: 1,
        price: 89.0,
      },
    ],
    rma_code: 'RMA-DE-419283',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    return_label_url: 'https://myhermes.de/retoure/RMA-DE-419283',
  },
];

// Initial starter reviews for demo verified products
const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev_1',
    product_id: 'prod_1',
    author_name: 'Markus W. (München)',
    rating: 5,
    comment: 'Hervorragende Qualität! Schnelle Lieferung per DHL innerhalb von 24 Stunden. Absolut empfehlenswert.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    verified_purchase: true,
  },
  {
    id: 'rev_2',
    product_id: 'prod_1',
    author_name: 'Sophie B. (Hamburg)',
    rating: 5,
    comment: 'Super verarbeitet, elegante Haptik. Kundenservice hat meine Frage zur Rechnung sofort beantwortet.',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    verified_purchase: true,
  },
  {
    id: 'rev_3',
    product_id: 'prod_2',
    author_name: 'Lukas K. (Berlin)',
    rating: 4,
    comment: 'Tolles Preis-Leistungs-Verhältnis. Per SEPA-Lastschrift bezahlt, unkomplizierter Ablauf.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    verified_purchase: true,
  },
];

export const storeService = {
  // ---------------- INITIAL SEEDING ----------------
  async seedInitialDataIfNeeded(): Promise<void> {
    if (isSeeding) return;
    isSeeding = true;
    try {
      // Check products
      const prodSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
      if (prodSnap.empty) {
        console.log('Seeding initial products into Firestore...');
        for (const p of INITIAL_PRODUCTS) {
          await setDoc(doc(db, COLLECTIONS.PRODUCTS, p.id), p);
        }
      }

      // Check categories
      const catSnap = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
      if (catSnap.empty) {
        console.log('Seeding initial categories into Firestore...');
        for (const c of INITIAL_CATEGORIES) {
          await setDoc(doc(db, COLLECTIONS.CATEGORIES, c.id), c);
        }
      }

      // Check orders
      const orderSnap = await getDocs(collection(db, COLLECTIONS.ORDERS));
      if (orderSnap.empty) {
        console.log('Seeding initial demo orders into Firestore...');
        for (const o of INITIAL_ORDERS) {
          const cleanOrder: Order = {
            ...o,
            invoice_number: `INV-2026-${o.order_number.replace(/\D/g, '').padStart(5, '0')}`,
          };
          await setDoc(doc(db, COLLECTIONS.ORDERS, o.id), cleanOrder);
        }
      }

      // Check coupons
      const couponSnap = await getDocs(collection(db, COLLECTIONS.COUPONS));
      if (couponSnap.empty) {
        for (const cp of INITIAL_COUPONS) {
          await setDoc(doc(db, COLLECTIONS.COUPONS, cp.id), cp);
        }
      }

      // Check reviews
      const reviewSnap = await getDocs(collection(db, COLLECTIONS.REVIEWS));
      if (reviewSnap.empty) {
        for (const r of INITIAL_REVIEWS) {
          await setDoc(doc(db, COLLECTIONS.REVIEWS, r.id), r);
        }
      }
    } catch (err) {
      console.warn('Initial seeding encountered check/write limit:', err);
    } finally {
      isSeeding = false;
    }
  },

  // ---------------- CATEGORIES ----------------
  async getCategories(): Promise<Category[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
      if (!snap.empty) {
        cachedCategories = snap.docs.map((d) => d.data() as Category);
        return cachedCategories;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.CATEGORIES);
    }
    await this.seedInitialDataIfNeeded();
    return INITIAL_CATEGORIES;
  },

  async addCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const id = `cat_${Date.now()}`;
    const newCat: Category = {
      ...category,
      id,
      created_at: new Date().toISOString(),
      is_active: true,
      product_count: 0,
    };
    try {
      await setDoc(doc(db, COLLECTIONS.CATEGORIES, id), newCat);
      cachedCategories.push(newCat);
      return newCat;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.CATEGORIES}/${id}`);
      return newCat;
    }
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    try {
      await updateDoc(doc(db, COLLECTIONS.CATEGORIES, id), updates);
      cachedCategories = cachedCategories.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const updated = cachedCategories.find((c) => c.id === id);
      return updated!;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.CATEGORIES}/${id}`);
      throw err;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, id));
      cachedCategories = cachedCategories.filter((c) => c.id !== id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.CATEGORIES}/${id}`);
    }
  },

  // ---------------- PRODUCTS ----------------
  async getProducts(): Promise<Product[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
      if (!snap.empty) {
        cachedProducts = snap.docs.map((d) => d.data() as Product);
        return cachedProducts;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.PRODUCTS);
    }
    await this.seedInitialDataIfNeeded();
    return INITIAL_PRODUCTS;
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, id));
      if (snap.exists()) {
        return snap.data() as Product;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTIONS.PRODUCTS}/${id}`);
    }
    const found = cachedProducts.find((p) => p.id === id);
    return found || null;
  },

  async addProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const id = `prod_${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
      created_at: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, COLLECTIONS.PRODUCTS, id), newProduct);
      cachedProducts = [newProduct, ...cachedProducts];
      return newProduct;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.PRODUCTS}/${id}`);
      return newProduct;
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      await updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), updates);
      cachedProducts = cachedProducts.map((p) => (p.id === id ? { ...p, ...updates } : p));
      const updated = cachedProducts.find((p) => p.id === id);
      return updated!;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.PRODUCTS}/${id}`);
      throw err;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
      cachedProducts = cachedProducts.filter((p) => p.id !== id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.PRODUCTS}/${id}`);
    }
  },

  subscribeToProducts(callback: (products: Product[]) => void): () => void {
    return onSnapshot(
      collection(db, COLLECTIONS.PRODUCTS),
      (snap) => {
        if (!snap.empty) {
          const prods = snap.docs.map((d) => d.data() as Product);
          cachedProducts = prods;
          callback(prods);
        } else {
          this.seedInitialDataIfNeeded().then(() => callback(INITIAL_PRODUCTS));
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PRODUCTS);
      }
    );
  },

  // ---------------- ORDERS & DELIVERY TRACKING ----------------
  async getOrders(): Promise<Order[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ORDERS));
      if (!snap.empty) {
        cachedOrders = snap.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return cachedOrders;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.ORDERS);
    }
    await this.seedInitialDataIfNeeded();
    return INITIAL_ORDERS;
  },

  async getOrdersByUser(userId: string): Promise<Order[]> {
    const all = await this.getOrders();
    return all.filter((o) => o.user_id === userId || (userId && o.customer_email.includes(userId)));
  },

  async getOrderByTrackingOrNumber(queryStr: string): Promise<Order | null> {
    const clean = queryStr.trim().toUpperCase();
    const all = await this.getOrders();
    return (
      all.find(
        (o) =>
          o.order_number.toUpperCase() === clean ||
          (o.tracking_number && o.tracking_number.toUpperCase() === clean) ||
          o.id.toUpperCase() === clean ||
          (o.invoice_number && o.invoice_number.toUpperCase() === clean) ||
          (o.tracking_number && clean.replace(/DE$/, 'US') === o.tracking_number.toUpperCase()) ||
          (o.tracking_number && clean.replace(/US$/, 'DE') === o.tracking_number.toUpperCase()) ||
          (o.tracking_number && clean.replace(/^DHL-/, 'BL-') === o.tracking_number.toUpperCase()) ||
          (o.tracking_number && clean.replace(/^BL-/, 'DHL-') === o.tracking_number.toUpperCase())
      ) || null
    );
  },

  async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const now = new Date().toISOString();
    const id = `ord_${Date.now()}`;
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      ...orderData,
      id,
      invoice_number: invoiceNum,
      created_at: now,
      updated_at: now,
    };

    try {
      await setDoc(doc(db, COLLECTIONS.ORDERS, id), newOrder);
      cachedOrders = [newOrder, ...cachedOrders];

      // Inventory decrement in Firestore
      for (const item of newOrder.items) {
        const prod = cachedProducts.find((p) => p.id === item.product_id);
        if (prod) {
          const newStock = Math.max(0, prod.inventory_count - item.quantity);
          prod.inventory_count = newStock;
          await updateDoc(doc(db, COLLECTIONS.PRODUCTS, prod.id), {
            inventory_count: newStock,
          }).catch(() => {});
        }
      }
      return newOrder;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.ORDERS}/${id}`);
      return newOrder;
    }
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    location?: string
  ): Promise<Order> {
    const now = new Date().toISOString();
    const order = (await this.getOrders()).find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const newEvent: DeliveryEvent = {
      id: `del_${Date.now()}`,
      timestamp: now,
      status,
      location: location || 'DHL Paketzentrum Frankfurt',
      description:
        note ||
        `Status updated to ${status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
    };

    const updatedOrder: Order = {
      ...order,
      order_status: status,
      updated_at: now,
      delivery_history: [...order.delivery_history, newEvent],
    };

    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        order_status: status,
        updated_at: now,
        delivery_history: updatedOrder.delivery_history,
      });
      cachedOrders = cachedOrders.map((o) => (o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.ORDERS}/${orderId}`);
      throw err;
    }
  },

  async updateTrackingDetails(
    orderId: string,
    trackingNumber: string,
    carrier: string,
    estimatedDelivery?: string
  ): Promise<Order> {
    const now = new Date().toISOString();
    const order = (await this.getOrders()).find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const newEvent: DeliveryEvent = {
      id: `del_${Date.now()}`,
      timestamp: now,
      status: order.order_status === 'placed' ? 'processing' : order.order_status,
      location: `${carrier} Dispatch Center`,
      description: `Carrier tracking number assigned: ${trackingNumber} (${carrier})`,
    };

    const updatedOrder: Order = {
      ...order,
      tracking_number: trackingNumber,
      carrier,
      estimated_delivery: estimatedDelivery || order.estimated_delivery,
      updated_at: now,
      delivery_history: [...order.delivery_history, newEvent],
    };

    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        tracking_number: trackingNumber,
        carrier,
        estimated_delivery: updatedOrder.estimated_delivery,
        updated_at: now,
        delivery_history: updatedOrder.delivery_history,
      });
      cachedOrders = cachedOrders.map((o) => (o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.ORDERS}/${orderId}`);
      throw err;
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ORDERS, id));
      cachedOrders = cachedOrders.filter((o) => o.id !== id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.ORDERS}/${id}`);
    }
  },

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  ): Promise<Order> {
    const now = new Date().toISOString();
    const order = (await this.getOrders()).find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const updatedOrder: Order = {
      ...order,
      payment_status: paymentStatus,
      updated_at: now,
    };

    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        payment_status: paymentStatus,
        updated_at: now,
      });
      cachedOrders = cachedOrders.map((o) => (o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.ORDERS}/${orderId}`);
      throw err;
    }
  },

  async simulateTestOrder(): Promise<Order> {
    const products = await this.getProducts();
    const available = products.filter((p) => p.inventory_count > 0);
    const selected = available.slice(0, 2);
    if (selected.length === 0 && products.length > 0) {
      selected.push(products[0]);
    }

    const orderNumber = `BC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const items = selected.map((p) => ({
      product_id: p.id,
      title: p.title,
      price: p.price,
      cost_price: p.cost_price || Math.round(p.price * 0.45 * 100) / 100,
      quantity: 1,
      image: p.images[0] || '',
    }));

    const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
    const tax = Math.round(subtotal * 0.19 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const trackingNum = `00340434${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const testOrder: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
      order_number: orderNumber,
      user_id: 'cust_demo_live',
      customer_name: 'Lukas Schneider',
      customer_email: 'lukas.schneider@example.de',
      customer_phone: '+49 171 9876543',
      shipping_address: {
        street: 'Maximilianstraße 42',
        city: 'München',
        state: 'Bayern',
        zip: '80539',
        country: 'Deutschland',
      },
      items,
      subtotal,
      tax,
      shipping_cost: 0,
      discount: 0,
      total,
      payment_method: 'stripe',
      payment_status: 'paid',
      stripe_payment_id: `ch_live_${Date.now()}`,
      payment_details: { method_name: 'Kreditkarte (Stripe)' },
      order_status: 'processing',
      tracking_number: trackingNum,
      carrier: 'DHL Paket (GoGreen)',
      estimated_delivery: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      delivery_history: [
        {
          id: `del_${Date.now()}_1`,
          timestamp: now,
          status: 'placed',
          location: 'BlueCart Storefront München',
          description: 'Bestellung erfolgreich eingegangen & bezahlt (Stripe)',
        },
        {
          id: `del_${Date.now()}_2`,
          timestamp: now,
          status: 'processing',
          location: 'Paketzentrum München / Aschheim',
          description: `Versandauftrag übermittelt an DHL (${trackingNum})`,
        },
      ],
    };

    return this.createOrder(testOrder);
  },

  subscribeToOrders(callback: (orders: Order[]) => void): () => void {
    return onSnapshot(
      collection(db, COLLECTIONS.ORDERS),
      (snap) => {
        if (!snap.empty) {
          const ords = snap.docs
            .map((d) => d.data() as Order)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          cachedOrders = ords;
          callback(ords);
        } else {
          callback(INITIAL_ORDERS);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ORDERS);
      }
    );
  },

  // ---------------- REVIEWS ----------------
  async getReviews(productId?: string): Promise<ProductReview[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.REVIEWS));
      if (!snap.empty) {
        const all = snap.docs.map((d) => d.data() as ProductReview);
        return productId ? all.filter((r) => r.product_id === productId) : all;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.REVIEWS);
    }
    return productId ? INITIAL_REVIEWS.filter((r) => r.product_id === productId) : INITIAL_REVIEWS;
  },

  async addReview(review: Omit<ProductReview, 'id' | 'created_at'>): Promise<ProductReview> {
    const id = `rev_${Date.now()}`;
    const newRev: ProductReview = {
      ...review,
      id,
      created_at: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, COLLECTIONS.REVIEWS, id), newRev);
      // Update product review count & rating in Firestore
      const prod = cachedProducts.find((p) => p.id === review.product_id);
      if (prod) {
        const reviews = await this.getReviews(review.product_id);
        const avg = (reviews.reduce((s, r) => s + r.rating, 0) + review.rating) / (reviews.length + 1);
        await updateDoc(doc(db, COLLECTIONS.PRODUCTS, prod.id), {
          reviews_count: (prod.reviews_count || 0) + 1,
          rating: Math.round(avg * 10) / 10,
        }).catch(() => {});
      }
      return newRev;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.REVIEWS}/${id}`);
      return newRev;
    }
  },

  // ---------------- WISHLIST ----------------
  async getWishlist(userId: string): Promise<string[]> {
    if (!userId) return [];
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.WISHLISTS, userId));
      if (snap.exists()) {
        const data = snap.data();
        return data.product_ids || [];
      }
    } catch (err) {
      console.warn('Wishlist read failed:', err);
    }
    return [];
  },

  async toggleWishlist(userId: string, productId: string): Promise<string[]> {
    if (!userId) return [];
    try {
      const current = await this.getWishlist(userId);
      const updated = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      await setDoc(doc(db, COLLECTIONS.WISHLISTS, userId), {
        id: userId,
        user_id: userId,
        product_ids: updated,
        updated_at: new Date().toISOString(),
      });
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.WISHLISTS}/${userId}`);
      return [];
    }
  },

  // ---------------- STATUTORY RETURNS (WIDERRUF) ----------------
  async getReturns(customerEmail?: string): Promise<ReturnRequest[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.RETURNS));
      if (!snap.empty) {
        const all = snap.docs.map((d) => d.data() as ReturnRequest);
        return customerEmail
          ? all.filter((r) => r.customer_email.toLowerCase() === customerEmail.toLowerCase())
          : all;
      }
      // Seed initial return requests for demonstration
      for (const ret of INITIAL_RETURNS) {
        await setDoc(doc(db, COLLECTIONS.RETURNS, ret.id), ret);
      }
      return customerEmail
        ? INITIAL_RETURNS.filter((r) => r.customer_email.toLowerCase() === customerEmail.toLowerCase())
        : INITIAL_RETURNS;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.RETURNS);
    }
    return INITIAL_RETURNS;
  },

  async createReturnRequest(
    data: Omit<ReturnRequest, 'id' | 'rma_code' | 'created_at' | 'status'>
  ): Promise<ReturnRequest> {
    const id = `ret_${Date.now()}`;
    const carrier = data.carrier || 'DHL';
    const rma = `RMA-DE-${Math.floor(100000 + Math.random() * 900000)}`;
    const tracking =
      carrier === 'Hermes'
        ? `H${Math.floor(10000000000000 + Math.random() * 90000000000000)}`
        : `00340434${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const newReq: ReturnRequest = {
      ...data,
      id,
      carrier,
      tracking_number: tracking,
      rma_code: rma,
      status: 'requested',
      created_at: new Date().toISOString(),
      return_label_url:
        carrier === 'Hermes'
          ? `https://myhermes.de/retoure/${rma}`
          : `https://dhl.de/retoure/${rma}`,
    };
    try {
      await setDoc(doc(db, COLLECTIONS.RETURNS, id), newReq);
      return newReq;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.RETURNS}/${id}`);
      return newReq;
    }
  },

  async updateReturnStatus(returnId: string, status: ReturnRequest['status']): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.RETURNS, returnId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.RETURNS}/${returnId}`);
    }
  },

  subscribeToReturns(callback: (returns: ReturnRequest[]) => void): () => void {
    return onSnapshot(
      collection(db, COLLECTIONS.RETURNS),
      (snap) => {
        if (!snap.empty) {
          const rets = snap.docs
            .map((d) => d.data() as ReturnRequest)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          callback(rets);
        } else {
          callback(INITIAL_RETURNS);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, COLLECTIONS.RETURNS);
      }
    );
  },

  // ---------------- COUPONS & PROMOS ----------------
  async getCoupons(): Promise<Coupon[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.COUPONS));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Coupon);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.COUPONS);
    }
    return INITIAL_COUPONS;
  },

  async validateCoupon(
    code: string,
    subtotal: number
  ): Promise<{ valid: boolean; discountPercent: number; discountAmount: number; message: string }> {
    const clean = code.trim().toUpperCase();
    const coupons = await this.getCoupons();
    const found = coupons.find((c) => c.code.toUpperCase() === clean && c.is_active);

    if (!found) {
      return {
        valid: false,
        discountPercent: 0,
        discountAmount: 0,
        message: 'Gutscheincode ungültig / Invalid discount voucher code',
      };
    }

    if (found.min_amount && subtotal < found.min_amount) {
      return {
        valid: false,
        discountPercent: 0,
        discountAmount: 0,
        message: `Mindestbestellwert von ${found.min_amount.toFixed(2)} € noch nicht erreicht`,
      };
    }

    if (found.code === 'VERSANDFREI') {
      return {
        valid: true,
        discountPercent: 0,
        discountAmount: 4.9, // Shipping fee waiver
        message: 'Kostenloser Versand aktiviert! (4,90 € gespart)',
      };
    }

    const discountAmount = Math.round(((subtotal * found.discount_percent) / 100) * 100) / 100;
    return {
      valid: true,
      discountPercent: found.discount_percent,
      discountAmount,
      message: `${found.discount_percent}% Rabatt angewendet (-${discountAmount.toFixed(2)} €)`,
    };
  },

  // ---------------- CARTS STORED IN FIRESTORE ----------------
  async getCart(cartId: string): Promise<{ items: any[]; promoCode?: string }> {
    if (!cartId) return { items: [] };
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.CARTS, cartId));
      if (snap.exists()) {
        const data = snap.data();
        return { items: data.items || [], promoCode: data.promo_code };
      }
    } catch (err) {
      console.warn('Firestore cart get error:', err);
    }
    return { items: [] };
  },

  async saveCart(cartId: string, items: any[], promoCode?: string): Promise<void> {
    if (!cartId) return;
    try {
      await setDoc(doc(db, COLLECTIONS.CARTS, cartId), {
        id: cartId,
        items,
        promo_code: promoCode || '',
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore cart save error:', err);
    }
  },

  async clearCart(cartId: string): Promise<void> {
    if (!cartId) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.CARTS, cartId));
    } catch (err) {
      console.warn('Firestore cart clear error:', err);
    }
  },

  // ---------------- RESTOCK NOTIFICATION ALERTS ----------------
  async getRestockAlerts(productId?: string): Promise<RestockAlert[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.RESTOCK_ALERTS));
      if (!snap.empty) {
        const alerts = snap.docs.map((d) => d.data() as RestockAlert);
        return productId ? alerts.filter((a) => a.product_id === productId) : alerts;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.RESTOCK_ALERTS);
    }
    return [];
  },

  async createRestockAlert(data: {
    email: string;
    productId: string;
    productTitle: string;
    userId?: string;
  }): Promise<RestockAlert> {
    const id = `rstk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAlert: RestockAlert = {
      id,
      user_id: data.userId || '',
      email: data.email.trim().toLowerCase(),
      product_id: data.productId,
      product_title: data.productTitle,
      created_at: new Date().toISOString(),
      notified: false,
    };
    try {
      await setDoc(doc(db, COLLECTIONS.RESTOCK_ALERTS, id), newAlert);
      return newAlert;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.RESTOCK_ALERTS}/${id}`);
      return newAlert;
    }
  },

  async triggerRestockNotifications(productId: string): Promise<number> {
    try {
      const alerts = await this.getRestockAlerts(productId);
      const pending = alerts.filter((a) => !a.notified);
      const now = new Date().toISOString();

      await Promise.all(
        pending.map((a) =>
          updateDoc(doc(db, COLLECTIONS.RESTOCK_ALERTS, a.id), {
            notified: true,
            notified_at: now,
          }).catch(() => {})
        )
      );

      return pending.length;
    } catch (err) {
      console.warn('Trigger restock notifications error:', err);
      return 0;
    }
  },

  // ---------------- REVENUE & ANALYTICS ----------------
  calculateRevenueAnalytics(orders: Order[], products: Product[]): RevenueAnalytics {
    const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

    const paidOrders = orders.filter(
      (o) => (o.payment_status === 'paid' || o.order_status === 'delivered') && o.order_status !== 'cancelled'
    );
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    const completedDeliveries = orders.filter((o) => o.order_status === 'delivered').length;
    const activeShipments = orders.filter((o) =>
      ['shipped', 'in_transit', 'out_for_delivery'].includes(o.order_status)
    ).length;

    // Daily revenue & profit calculation for past 7 days
    const daysMap: Record<string, { revenue: number; orders: number; profit: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      daysMap[key] = { revenue: 0, orders: 0, profit: 0 };
    }

    orders.forEach((o) => {
      const dateKey = (o.created_at || '').split('T')[0];
      if (daysMap[dateKey]) {
        daysMap[dateKey].orders += 1;
        if (o.payment_status === 'paid') {
          daysMap[dateKey].revenue += o.total ?? 0;

          let orderItemsCost = 0;
          (o.items || []).forEach((item) => {
            const prod = productMap.get(item.product_id);
            const unitCost =
              typeof item.cost_price === 'number'
                ? item.cost_price
                : (prod?.cost_price ?? Math.round((item.price ?? 0) * 0.45 * 100) / 100);
            orderItemsCost += unitCost * (item.quantity ?? 1);
          });
          const orderProfit = Math.max(0, (o.subtotal ?? 0) - orderItemsCost);
          daysMap[dateKey].profit += orderProfit;
        }
      }
    });

    const dailySales = Object.entries(daysMap).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
      profit: Math.round(data.profit * 100) / 100,
    }));

    // Status distribution
    const statusCounts: Record<OrderStatus, number> = {
      placed: 0,
      processing: 0,
      shipped: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((o) => {
      if (statusCounts[o.order_status] !== undefined) {
        statusCounts[o.order_status]++;
      }
    });

    const statusDistribution = (Object.keys(statusCounts) as OrderStatus[]).map((status) => ({
      status,
      count: statusCounts[status],
      percentage: totalOrders > 0 ? Math.round((statusCounts[status] / totalOrders) * 100) : 0,
    }));

    // Category revenue & profit breakdown
    const categoryRevMap: Record<string, { revenue: number; count: number; profit: number }> = {};
    orders.forEach((o) => {
      if (o.payment_status === 'paid' && o.order_status !== 'cancelled') {
        (o.items || []).forEach((item) => {
          const prod = productMap.get(item.product_id);
          const cat = prod?.category_name || 'Retail Goods';
          const unitCost =
            typeof item.cost_price === 'number'
              ? item.cost_price
              : (prod?.cost_price ?? Math.round((item.price ?? 0) * 0.45 * 100) / 100);

          if (!categoryRevMap[cat]) categoryRevMap[cat] = { revenue: 0, count: 0, profit: 0 };
          const itemRev = (item.price ?? 0) * (item.quantity ?? 1);
          const itemCost = unitCost * (item.quantity ?? 1);
          categoryRevMap[cat].revenue += itemRev;
          categoryRevMap[cat].count += item.quantity ?? 1;
          categoryRevMap[cat].profit += itemRev - itemCost;
        });
      }
    });

    const categoryRevenue = Object.entries(categoryRevMap).map(([category, val]) => ({
      category,
      revenue: Math.round(val.revenue * 100) / 100,
      count: val.count,
      profit: Math.round(val.profit * 100) / 100,
    }));

    // Item sales, cost, profit, and margin breakdown per item
    const itemSalesMap = new Map<
      string,
      {
        productId: string;
        title: string;
        title_de?: string;
        sku: string;
        categoryName: string;
        image: string;
        price: number;
        costPrice: number;
        unitsSold: number;
        grossRevenue: number;
        totalCost: number;
        inventoryCount: number;
      }
    >();

    // Pre-populate with all products in store
    products.forEach((p) => {
      const cost =
        typeof p.cost_price === 'number'
          ? p.cost_price
          : Math.round((p.price ?? 0) * 0.45 * 100) / 100;
      itemSalesMap.set(p.id, {
        productId: p.id,
        title: p.title,
        title_de: p.title_de,
        sku: p.sku || 'BC-SKU',
        categoryName: p.category_name || 'General',
        image: p.images[0] || '',
        price: p.price ?? 0,
        costPrice: cost,
        unitsSold: 0,
        grossRevenue: 0,
        totalCost: 0,
        inventoryCount: p.inventory_count ?? 0,
      });
    });

    // Aggregate sales from paid orders
    orders.forEach((o) => {
      if (o.payment_status === 'paid' && o.order_status !== 'cancelled') {
        (o.items || []).forEach((item) => {
          const existing = itemSalesMap.get(item.product_id);
          const prod = productMap.get(item.product_id);
          const unitCost =
            typeof item.cost_price === 'number'
              ? item.cost_price
              : (prod?.cost_price ?? Math.round((item.price ?? 0) * 0.45 * 100) / 100);

          if (existing) {
            existing.unitsSold += item.quantity ?? 1;
            existing.grossRevenue += (item.price ?? 0) * (item.quantity ?? 1);
            existing.totalCost += unitCost * (item.quantity ?? 1);
          } else {
            itemSalesMap.set(item.product_id, {
              productId: item.product_id,
              title: item.title,
              sku: 'BC-ITEM',
              categoryName: prod?.category_name || 'General',
              image: item.image || '',
              price: item.price ?? 0,
              costPrice: unitCost,
              unitsSold: item.quantity ?? 1,
              grossRevenue: (item.price ?? 0) * (item.quantity ?? 1),
              totalCost: unitCost * (item.quantity ?? 1),
              inventoryCount: prod?.inventory_count ?? 0,
            });
          }
        });
      }
    });

    const itemSalesMetrics: ItemSalesMetric[] = Array.from(itemSalesMap.values())
      .map((m) => {
        const grossRevenue = Math.round(m.grossRevenue * 100) / 100;
        const totalCost = Math.round(m.totalCost * 100) / 100;
        const totalProfit = Math.round((grossRevenue - totalCost) * 100) / 100;
        const unitProfit = Math.round((m.price - m.costPrice) * 100) / 100;
        const marginPercent =
          m.price > 0 ? Math.round(((m.price - m.costPrice) / m.price) * 1000) / 10 : 0;

        return {
          productId: m.productId,
          title: m.title,
          title_de: m.title_de,
          sku: m.sku,
          categoryName: m.categoryName,
          image: m.image,
          price: m.price,
          costPrice: m.costPrice,
          unitProfit,
          marginPercent,
          unitsSold: m.unitsSold,
          grossRevenue,
          totalCost,
          totalProfit,
          inventoryCount: m.inventoryCount,
        };
      })
      .sort((a, b) => b.totalProfit - a.totalProfit || b.unitsSold - a.unitsSold);

    const totalCost = Math.round(
      itemSalesMetrics.reduce((sum, item) => sum + item.totalCost, 0) * 100
    ) / 100;
    const totalProfit = Math.round((totalRevenue - totalCost) * 100) / 100;
    const blendedMargin =
      totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost,
      totalProfit,
      blendedMargin,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      completedDeliveries,
      activeShipments,
      dailySales,
      categoryRevenue,
      statusDistribution,
      itemSalesMetrics,
    };
  },

  async getRevenueAnalytics(ordersOverride?: Order[], productsOverride?: Product[]): Promise<RevenueAnalytics> {
    const orders = ordersOverride || (await this.getOrders());
    const products = productsOverride || (await this.getProducts());
    return this.calculateRevenueAnalytics(orders, products);
  },

  async resetToDefaults() {
    await this.seedInitialDataIfNeeded();
  },

  // ---------------- USER PROFILE & EUROPEAN WHATSAPP ----------------
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // First check localStorage for snappy client-side load
      const localKey = `bluecart_user_${userId}`;
      const localData = localStorage.getItem(localKey);
      let localProfile: UserProfile | null = localData ? JSON.parse(localData) : null;

      try {
        const docRef = doc(db, COLLECTIONS.USERS, userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const profile = snap.data() as UserProfile;
          localStorage.setItem(localKey, JSON.stringify(profile));
          return profile;
        }
      } catch (fbErr) {
        // Fallback to local profile or server API
      }

      return localProfile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<UserProfile> {
    const updated: UserProfile = {
      ...profile,
      last_login_at: new Date().toISOString(),
    };

    try {
      // 1. Save to localStorage
      localStorage.setItem(`bluecart_user_${profile.id}`, JSON.stringify(updated));
      if (profile.whatsapp_number) {
        localStorage.setItem(`bluecart_user_phone_${profile.whatsapp_number}`, JSON.stringify(updated));
      }
      if (profile.email) {
        localStorage.setItem(`bluecart_user_email_${profile.email.toLowerCase()}`, JSON.stringify(updated));
      }

      // 2. Persist to Firestore
      try {
        await setDoc(doc(db, COLLECTIONS.USERS, profile.id), updated, { merge: true });
      } catch (fbErr) {
        console.warn('Firestore user profile save notice (offline fallback active):', fbErr);
      }

      // 3. Sync with backend API
      try {
        await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: updated }),
        });
      } catch {
        // Ignored
      }

      return updated;
    } catch (err) {
      console.error('Failed to save user profile:', err);
      return updated;
    }
  },

  async findUserProfileByIdentifier(identifier: string): Promise<UserProfile | null> {
    const clean = identifier.trim().toLowerCase();
    // Check phone key
    const phoneData = localStorage.getItem(`bluecart_user_phone_${clean}`);
    if (phoneData) return JSON.parse(phoneData);

    // Check email key
    const emailData = localStorage.getItem(`bluecart_user_email_${clean}`);
    if (emailData) return JSON.parse(emailData);

    // Try Firestore query
    try {
      const q = query(collection(db, COLLECTIONS.USERS), where('whatsapp_number', '==', clean));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserProfile;
      }
    } catch {
      // Ignored
    }

    return null;
  },
};
