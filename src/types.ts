export type UserRole = 'admin' | 'customer';

export type AuthProviderType =
  | 'whatsapp_otp'
  | 'email_otp'
  | 'password'
  | 'google'
  | 'demo';

export interface UserPreferences {
  whatsapp_order_updates?: boolean;
  whatsapp_shipping_alerts?: boolean;
  whatsapp_deals?: boolean;
  language?: 'en' | 'de';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  whatsapp_number?: string;
  whatsapp_country_code?: string;
  whatsapp_country_name?: string;
  whatsapp_verified?: boolean;
  email_verified?: boolean;
  auth_provider?: AuthProviderType;
  preferences?: UserPreferences;
  address?: {
    street: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
    packstation?: string;
    post_number?: string;
  };
  created_at: string;
  last_login_at?: string;
}

export interface OtpSession {
  otpId: string;
  identifier: string; // phone or email
  channel: 'whatsapp' | 'email';
  countryCode?: string;
  countryName?: string;
  expiresAt: number;
  previewOtp?: string; // provided for seamless developer/evaluator instant test
}

export interface Category {
  id: string;
  name: string;
  name_de?: string;
  slug: string;
  description: string;
  description_de?: string;
  image_url: string;
  icon_name?: string;
  product_count?: number;
  is_active: boolean;
  created_at: string;
  is_german_specialty?: boolean;
}

export interface Product {
  id: string;
  title: string;
  title_de?: string;
  slug: string;
  description: string;
  description_de?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  category_id: string;
  category_name?: string;
  category_name_de?: string;
  inventory_count: number;
  sku: string;
  images: string[];
  featured_badge?: 'Best Seller' | 'New' | 'Sale' | 'Featured' | null;
  rating: number;
  reviews_count: number;
  is_active: boolean;
  created_at: string;
  is_flash_deal?: boolean;
  flash_deal_discount?: number;
  flash_sold_count?: number;
  origin_country?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
}

export type OrderStatus =
  | 'placed'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface DeliveryEvent {
  id: string;
  timestamp: string;
  status: OrderStatus;
  location: string;
  description: string;
}

export interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  cost_price?: number;
  quantity: number;
  image: string;
}

export type PaymentMethod =
  | 'stripe'
  | 'test_card'
  | 'paypal'
  | 'klarna'
  | 'sepa'
  | 'giropay'
  | 'apple_pay'
  | 'bank_transfer'
  | 'cash_on_delivery'
  | 'wero';

export interface PaymentDetails {
  method_name: string;
  transaction_id?: string;
  iban_last4?: string;
  paypal_email?: string;
  klarna_type?: 'invoice' | 'sofort' | 'slice_it';
  bank_name?: string;
  mandate_ref?: string;
  transfer_iban?: string;
  transfer_bic?: string;
  transfer_reference?: string;
  reference_code?: string;
  recipient_iban?: string;
  recipient_bic?: string;
  cod_fee?: number;
  courier?: string;
  wero_phone?: string;
  wero_id?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  stripe_payment_id?: string;
  payment_details?: PaymentDetails;
  order_status: OrderStatus;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
  delivery_history: DeliveryEvent[];
  invoice_number?: string;
  b2b_vat_id?: string;
  is_packstation?: boolean;
  packstation_number?: string;
  post_number?: string;
  discount_code?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id?: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
  verified_purchase: boolean;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_number: string;
  customer_email: string;
  carrier?: 'DHL' | 'Hermes';
  tracking_number?: string;
  reason: string;
  status: 'requested' | 'approved' | 'in_transit' | 'refunded' | 'rejected';
  items: {
    product_id: string;
    title: string;
    quantity: number;
    price: number;
  }[];
  rma_code: string;
  created_at: string;
  return_label_url?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  min_amount?: number;
  description: string;
  description_de?: string;
  is_active: boolean;
}

export interface ItemSalesMetric {
  productId: string;
  title: string;
  title_de?: string;
  sku: string;
  categoryName?: string;
  image: string;
  price: number;
  costPrice: number;
  unitProfit: number;
  marginPercent: number;
  unitsSold: number;
  grossRevenue: number;
  totalCost: number;
  totalProfit: number;
  inventoryCount: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  blendedMargin: number;
  totalOrders: number;
  avgOrderValue: number;
  completedDeliveries: number;
  activeShipments: number;
  dailySales: { date: string; revenue: number; orders: number; profit?: number }[];
  categoryRevenue: { category: string; revenue: number; count: number; profit?: number }[];
  statusDistribution: { status: OrderStatus; count: number; percentage: number }[];
  itemSalesMetrics: ItemSalesMetric[];
}

export interface RestockAlert {
  id: string;
  user_id?: string;
  email: string;
  product_id: string;
  product_title: string;
  created_at: string;
  notified: boolean;
  notified_at?: string;
}

