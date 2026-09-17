import React, { useState, useEffect } from 'react';
import {
  Category,
  Product,
  Order,
  OrderStatus,
  RevenueAnalytics,
  RestockAlert,
  ReturnRequest,
} from '../types';
import { storeService } from '../lib/storeService';
import {
  LayoutDashboard,
  Package,
  Layers,
  Truck,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  Database,
  ExternalLink,
  X,
  HelpCircle,
  Percent,
  ArrowUpRight,
  Download,
  BadgeDollarSign,
  Receipt,
  ArrowUpDown,
  Bell,
  Mail,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onRefreshData }) => {
  const { isAdmin } = useAuth();

  // Strict role guard: Never render admin details if the current user is not an administrator
  if (!isAdmin) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'categories' | 'deliveries' | 'returns' | 'alerts' | 'setup'
  >('overview');

  // State
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restockAlerts, setRestockAlerts] = useState<RestockAlert[]>([]);
  const [returnsList, setReturnsList] = useState<ReturnRequest[]>([]);
  const [returnStatusFilter, setReturnStatusFilter] = useState<string>('all');
  const [returnCarrierFilter, setReturnCarrierFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [productSortBy, setProductSortBy] = useState<
    'default' | 'profit_desc' | 'margin_desc' | 'sales_desc' | 'price_desc'
  >('default');

  // Modals inside Admin
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [managingDeliveryOrder, setManagingDeliveryOrder] = useState<Order | null>(null);

  // New product form
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    compare_at_price: '',
    cost_price: '',
    category_id: '',
    inventory_count: '25',
    sku: '',
    images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    featured_badge: '' as any,
  });

  // New category form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    icon_name: 'Layers',
  });

  // Delivery update form
  const [deliveryStatusUpdate, setDeliveryStatusUpdate] = useState<OrderStatus>('processing');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toLocaleTimeString());
  const [isSimulatingSale, setIsSimulatingSale] = useState(false);

  useEffect(() => {
    loadAllData();

    // Real-time Firestore subscription for customer orders (instantly updates sales!)
    const unsubOrders = storeService.subscribeToOrders((newOrders) => {
      setOrders(newOrders);
      setLastUpdatedTime(new Date().toLocaleTimeString());
    });

    // Real-time Firestore subscription for return requests (§ 355 BGB)
    const unsubReturns = storeService.subscribeToReturns((newReturns) => {
      setReturnsList(newReturns);
    });

    return () => {
      unsubOrders();
      unsubReturns();
    };
  }, []);

  // Recalculate live sales analytics whenever orders or products change
  useEffect(() => {
    if (orders.length > 0 && products.length > 0) {
      const liveAnalytics = storeService.calculateRevenueAnalytics(orders, products);
      setAnalytics(liveAnalytics);
      setLastUpdatedTime(new Date().toLocaleTimeString());
    }
  }, [orders, products]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats, ords, an, alerts, rets] = await Promise.all([
        storeService.getProducts(),
        storeService.getCategories(),
        storeService.getOrders(),
        storeService.getRevenueAnalytics(),
        storeService.getRestockAlerts(),
        storeService.getReturns(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setOrders(ords);
      setAnalytics(an);
      setRestockAlerts(alerts);
      setReturnsList(rets);
      setLastUpdatedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkOrderPaid = async (orderId: string) => {
    try {
      await storeService.updatePaymentStatus(orderId, 'paid');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, payment_status: 'paid' } : o))
      );
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error marking order as paid:', err);
    }
  };

  const handleSimulateLiveSale = async () => {
    setIsSimulatingSale(true);
    try {
      await storeService.simulateTestOrder();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error simulating live sale:', err);
    } finally {
      setIsSimulatingSale(false);
    }
  };

  const handleUpdateReturnStatus = async (returnId: string, status: ReturnRequest['status']) => {
    try {
      await storeService.updateReturnStatus(returnId, status);
      const updated = await storeService.getReturns();
      setReturnsList(updated);
    } catch (err) {
      console.error('Error updating return status:', err);
    }
  };

  // Product actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === productForm.category_id);
    const parsedPrice = parseFloat(productForm.price) || 0;
    const parsedCost = productForm.cost_price ? parseFloat(productForm.cost_price) : undefined;
    const newInventory = parseInt(productForm.inventory_count, 10) || 0;

    const productPayload = {
      title: productForm.title,
      slug: productForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: productForm.description,
      price: parsedPrice,
      compare_at_price: productForm.compare_at_price ? parseFloat(productForm.compare_at_price) : undefined,
      cost_price: parsedCost,
      category_id: productForm.category_id || categories[0]?.id || 'cat_electronics',
      category_name: cat?.name || 'General',
      inventory_count: newInventory,
      sku: productForm.sku || `BC-SKU-${Math.floor(100 + Math.random() * 900)}`,
      images: [productForm.images.trim()],
      featured_badge: productForm.featured_badge || null,
      rating: 5.0,
      reviews_count: 1,
      is_active: true,
    };

    if (editingProduct) {
      const wasOutOfStock = editingProduct.inventory_count <= 0;
      await storeService.updateProduct(editingProduct.id, productPayload);
      if (wasOutOfStock && newInventory > 0) {
        await storeService.triggerRestockNotifications(editingProduct.id);
      }
    } else {
      await storeService.addProduct(productPayload);
    }

    setIsAddProductOpen(false);
    setEditingProduct(null);
    resetProductForm();
    await loadAllData();
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to remove this product from inventory?')) {
      await storeService.deleteProduct(id);
      await loadAllData();
      if (onRefreshData) onRefreshData();
    }
  };

  const resetProductForm = () => {
    setProductForm({
      title: '',
      description: '',
      price: '',
      compare_at_price: '',
      cost_price: '',
      category_id: categories[0]?.id || '',
      inventory_count: '25',
      sku: '',
      images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      featured_badge: '' as any,
    });
  };

  // Category actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: categoryForm.description,
      image_url: categoryForm.image_url,
      icon_name: categoryForm.icon_name,
      is_active: true,
    };

    if (editingCategory) {
      await storeService.updateCategory(editingCategory.id, payload);
    } else {
      await storeService.addCategory(payload);
    }

    setIsAddCategoryOpen(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', description: '', image_url: '', icon_name: 'Layers' });
    await loadAllData();
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category? Products in this category will become unassigned.')) {
      await storeService.deleteCategory(id);
      await loadAllData();
      if (onRefreshData) onRefreshData();
    }
  };

  // Delivery & Order Tracking actions
  const handleOpenManageDelivery = (order: Order) => {
    setManagingDeliveryOrder(order);
    setDeliveryStatusUpdate(order.order_status);
    setTrackingNumberInput(order.tracking_number || '');
    setCarrierInput(order.carrier || 'BlueLogistics Express');
    setDeliveryLocation('Seattle Regional Sorting Hub');
    setDeliveryNote('');
  };

  const handleApplyDeliveryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingDeliveryOrder) return;

    try {
      // Update tracking number if changed
      if (
        trackingNumberInput !== managingDeliveryOrder.tracking_number ||
        carrierInput !== managingDeliveryOrder.carrier
      ) {
        await storeService.updateTrackingDetails(
          managingDeliveryOrder.id,
          trackingNumberInput,
          carrierInput
        );
      }

      // Update status & append event
      const updated = await storeService.updateOrderStatus(
        managingDeliveryOrder.id,
        deliveryStatusUpdate,
        deliveryNote || `Milestone reached: ${deliveryStatusUpdate.replace('_', ' ')}`,
        deliveryLocation || 'Fulfillment Terminal'
      );

      setManagingDeliveryOrder(updated);
      await loadAllData();
      if (onRefreshData) onRefreshData();
      setManagingDeliveryOrder(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate per-product sales metrics map from paid customer orders
  const productSalesMap = React.useMemo(() => {
    const map: Record<
      string,
      { unitsSold: number; grossRevenue: number; totalCost: number; totalProfit: number }
    > = {};
    orders.forEach((o) => {
      if (
        (o.payment_status === 'paid' || o.order_status === 'delivered') &&
        o.order_status !== 'cancelled'
      ) {
        (o.items || []).forEach((item) => {
          if (!item || !item.product_id) return;
          const prod = products.find((p) => p.id === item.product_id);
          const unitCost =
            typeof item.cost_price === 'number'
              ? item.cost_price
              : (prod?.cost_price ?? Math.round(item.price * 0.45 * 100) / 100);
          if (!map[item.product_id]) {
            map[item.product_id] = {
              unitsSold: 0,
              grossRevenue: 0,
              totalCost: 0,
              totalProfit: 0,
            };
          }
          const itemRev = item.price * item.quantity;
          const itemCost = unitCost * item.quantity;
          map[item.product_id].unitsSold += item.quantity;
          map[item.product_id].grossRevenue += itemRev;
          map[item.product_id].totalCost += itemCost;
          map[item.product_id].totalProfit += itemRev - itemCost;
        });
      }
    });
    return map;
  }, [orders, products]);

  // Overall catalog inventory cost & margin stats
  const catalogStats = React.useMemo(() => {
    let totalInventoryCost = 0;
    let totalInventoryRetailVal = 0;
    let totalProfitRealized = 0;
    let totalSalesUnits = 0;
    let totalMarginSum = 0;
    let topProduct: { title: string; profit: number } = { title: 'None', profit: 0 };

    products.forEach((p) => {
      const cost =
        typeof p.cost_price === 'number'
          ? p.cost_price
          : Math.round(p.price * 0.45 * 100) / 100;
      totalInventoryCost += cost * p.inventory_count;
      totalInventoryRetailVal += p.price * p.inventory_count;
      const unitMargin = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
      totalMarginSum += unitMargin;

      const sales = productSalesMap[p.id];
      if (sales) {
        totalProfitRealized += sales.totalProfit;
        totalSalesUnits += sales.unitsSold;
        if (sales.totalProfit > topProduct.profit) {
          topProduct = { title: p.title, profit: sales.totalProfit };
        }
      }
    });

    const avgMargin = products.length > 0 ? totalMarginSum / products.length : 0;

    return {
      totalInventoryCost,
      totalInventoryRetailVal,
      totalProfitRealized,
      totalSalesUnits,
      avgMargin,
      topProduct,
    };
  }, [products, productSalesMap]);

  // Filtered & Sorted Products
  const filteredProducts = React.useMemo(() => {
    const list = products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCat =
        selectedProductCategory === 'all' || p.category_id === selectedProductCategory;
      return matchesSearch && matchesCat;
    });

    return list.sort((a, b) => {
      const salesA = productSalesMap[a.id] || { unitsSold: 0, grossRevenue: 0, totalCost: 0, totalProfit: 0 };
      const salesB = productSalesMap[b.id] || { unitsSold: 0, grossRevenue: 0, totalCost: 0, totalProfit: 0 };
      const costA = typeof a.cost_price === 'number' ? a.cost_price : Math.round(a.price * 0.45 * 100) / 100;
      const costB = typeof b.cost_price === 'number' ? b.cost_price : Math.round(b.price * 0.45 * 100) / 100;
      const marginA = a.price > 0 ? ((a.price - costA) / a.price) * 100 : 0;
      const marginB = b.price > 0 ? ((b.price - costB) / b.price) * 100 : 0;

      switch (productSortBy) {
        case 'profit_desc':
          return salesB.totalProfit - salesA.totalProfit;
        case 'margin_desc':
          return marginB - marginA;
        case 'sales_desc':
          return salesB.unitsSold - salesA.unitsSold;
        case 'price_desc':
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }, [products, productSearch, selectedProductCategory, productSortBy, productSalesMap]);

  // Export Margin & Profit Report to CSV
  const exportMarginProfitCSV = () => {
    const headers = [
      'Product Title',
      'SKU',
      'Category',
      'Cost Price (COGS)',
      'Retail Price',
      'Unit Profit ($)',
      'Unit Margin (%)',
      'Units Sold',
      'Gross Sales ($)',
      'Total COGS of Sold ($)',
      'Net Profit Realized ($)',
      'Stock In Inventory',
    ];

    const rows = products.map((p) => {
      const sales = productSalesMap[p.id] || {
        unitsSold: 0,
        grossRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
      };
      const cost =
        typeof p.cost_price === 'number'
          ? p.cost_price
          : Math.round((p.price ?? 0) * 0.45 * 100) / 100;
      const unitProfit = Math.max(0, (p.price ?? 0) - cost);
      const marginPct = (p.price ?? 0) > 0 ? ((unitProfit / p.price) * 100).toFixed(1) : '0';

      return [
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${p.sku || ''}"`,
        `"${p.category_name || ''}"`,
        (cost ?? 0).toFixed(2),
        (p.price ?? 0).toFixed(2),
        (unitProfit ?? 0).toFixed(2),
        `${marginPct}%`,
        sales.unitsSold ?? 0,
        (sales.grossRevenue ?? 0).toFixed(2),
        (sales.totalCost ?? 0).toFixed(2),
        (sales.totalProfit ?? 0).toFixed(2),
        p.inventory_count ?? 0,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bluecart-item-margin-profit-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.order_status === orderStatusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Admin Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  BlueCart Admin Central
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-md border border-emerald-400/30">
                  Firestore Live • § 14 UStG
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage products, categories, track shipments, and inspect revenue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Firestore Sync Status Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 rounded-lg text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Sync ({lastUpdatedTime})</span>
            </div>

            {/* Quick Test: Simulate Customer Sale */}
            <button
              onClick={handleSimulateLiveSale}
              disabled={isSimulatingSale}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Simuliert einen echten bezahlten Kundenauftrag und aktualisiert sofort die Umsatzzahlen"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isSimulatingSale ? 'Simuliere...' : '+ Test-Verkauf simulieren'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={loadAllData}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Daten neu laden"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100/80 px-6 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Revenue & Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('deliveries')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'deliveries'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Delivery Tracking ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'returns'
                ? 'bg-white text-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-purple-500" />
            <span>
              Returns (§ 355 BGB) ({returnsList.filter((r) => r.status === 'requested' || r.status === 'in_transit').length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>
              Restock Alerts ({restockAlerts.filter((a) => !a.notified).length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'setup'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Compliance & Backend</span>
          </button>
        </div>

        {/* Dashboard Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* TAB 1: REVENUE & OVERVIEW */}
              {activeTab === 'overview' && analytics && (
                <div className="space-y-6">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Realized Net Profit */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Total Net Profit
                        </span>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                        ${(analytics.totalProfit ?? 0).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {(analytics.blendedMargin ?? 0).toFixed(1)}% margin
                        </span>
                        <span className="text-[11px] text-slate-500">blended profit</span>
                      </div>
                    </div>

                    {/* Gross Revenue */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Gross Revenue
                        </span>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        ${(analytics.totalRevenue ?? 0).toFixed(2)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {analytics.totalOrders ?? 0} orders (Avg ${(analytics.avgOrderValue ?? 0).toFixed(2)})
                      </p>
                    </div>

                    {/* Total COGS */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Total Cost (COGS)
                        </span>
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                          <Receipt className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        ${(analytics.totalCost ?? 0).toFixed(2)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Direct product acquisition cost
                      </p>
                    </div>

                    {/* Shipments Status */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Deliveries Status
                        </span>
                        <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                          <Truck className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {analytics.completedDeliveries} / {analytics.totalOrders}
                      </p>
                      <p className="text-[11px] text-blue-600 font-semibold mt-1">
                        {analytics.activeShipments} active in transit
                      </p>
                    </div>
                  </div>

                  {/* Daily Sales Chart & Status Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual Daily Revenue Bars */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Daily Revenue Trend (USD)
                          </h3>
                          <p className="text-xs text-slate-400">Recent 7-day performance</p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          Live Stripe Metrics
                        </span>
                      </div>

                      <div className="h-52 flex items-end justify-between gap-3 pt-4 border-b border-slate-100">
                        {analytics.dailySales.map((day, i) => {
                          const maxRev = Math.max(...analytics.dailySales.map((d) => d.revenue), 100);
                          const heightPct = Math.max(12, Math.round((day.revenue / maxRev) * 100));

                          return (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center gap-2 group relative"
                            >
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                                ${(day.revenue ?? 0).toFixed(2)} ({day.orders ?? 0} orders)
                              </div>

                              <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg h-44 flex items-end justify-center overflow-hidden">
                                <div
                                  className="w-full bg-blue-600 hover:bg-blue-700 transition-all rounded-t-lg"
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>

                              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                                {day.date}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Status Breakdown */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">
                          Delivery Status Distribution
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">Pipeline fulfillment stages</p>

                        <div className="space-y-3">
                          {analytics.statusDistribution.map((item) => (
                            <div key={item.status} className="text-xs">
                              <div className="flex justify-between font-semibold mb-1">
                                <span className="capitalize text-slate-700">
                                  {item.status.replace('_', ' ')}
                                </span>
                                <span className="text-slate-900">{item.count} orders</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4">
                        <button
                          onClick={() => setActiveTab('deliveries')}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span>Inspect Live Shipments</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Item-Level Sales, Profit & Margin Leaderboard */}
                  {analytics.itemSalesMetrics && analytics.itemSalesMetrics.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Item Sales, Profit & Margin Leaderboard
                          </h3>
                          <p className="text-xs text-slate-400">
                            Breakdown of revenue, direct unit costs, and net margin realized per item
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('products')}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Manage Catalog</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-2.5">Item</th>
                              <th className="px-4 py-2.5">Units Sold</th>
                              <th className="px-4 py-2.5">Gross Revenue</th>
                              <th className="px-4 py-2.5">Total COGS</th>
                              <th className="px-4 py-2.5">Net Profit Realized</th>
                              <th className="px-4 py-2.5">Realized Margin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {analytics.itemSalesMetrics.map((m) => {
                              const grossRev = m.grossRevenue ?? 0;
                              const tCost = m.totalCost ?? 0;
                              const tProfit = m.totalProfit ?? 0;
                              const margin = m.marginPercent ?? 0;
                              return (
                                <tr key={m.productId} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-4 py-3 font-semibold text-slate-900">
                                    {m.title}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-700">
                                    {m.unitsSold ?? 0} units
                                  </td>
                                  <td className="px-4 py-3 font-mono font-medium text-slate-900">
                                    ${grossRev.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-500">
                                    ${tCost.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                                    +${tProfit.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                        margin >= 50
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : margin >= 30
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {margin.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PRODUCTS MANAGEMENT WITH MARGIN & PROFIT PER ITEM */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  {/* Executive Product Profit & Margin Metric Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Realized Sales Profit
                      </span>
                      <p className="text-lg font-extrabold text-emerald-700 tracking-tight">
                        ${(catalogStats.totalProfitRealized ?? 0).toFixed(2)}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {catalogStats.totalSalesUnits ?? 0} units sold across orders
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Avg Catalog Margin
                      </span>
                      <p className="text-lg font-extrabold text-blue-700 tracking-tight">
                        {(catalogStats.avgMargin ?? 0).toFixed(1)}%
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {products.length} active SKU offerings
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Total Stock Valuation
                      </span>
                      <p className="text-lg font-extrabold text-slate-900 tracking-tight">
                        ${(catalogStats.totalInventoryRetailVal ?? 0).toFixed(2)}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        COGS: ${(catalogStats.totalInventoryCost ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Top Profit Driver
                      </span>
                      <p className="text-xs font-bold text-slate-900 truncate" title={catalogStats.topProduct?.title || 'None'}>
                        {catalogStats.topProduct?.title || 'None'}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-600">
                        +${(catalogStats.topProduct?.profit ?? 0).toFixed(2)} net profit
                      </span>
                    </div>
                  </div>

                  {/* Filter & Action Controls */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      {/* Search */}
                      <div className="relative flex-1 sm:w-56">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search title or SKU..."
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-600"
                        />
                      </div>

                      {/* Category Filter */}
                      <select
                        value={selectedProductCategory}
                        onChange={(e) => setSelectedProductCategory(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none"
                      >
                        <option value="all">All Departments</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {/* Sort Selector */}
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={productSortBy}
                          onChange={(e) => setProductSortBy(e.target.value as any)}
                          className="bg-transparent text-xs text-slate-700 outline-none font-medium cursor-pointer"
                        >
                          <option value="default">Sort: Default</option>
                          <option value="profit_desc">Highest Realized Profit</option>
                          <option value="margin_desc">Highest Margin %</option>
                          <option value="sales_desc">Most Units Sold</option>
                          <option value="price_desc">Highest Retail Price</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      {/* Export CSV Button */}
                      <button
                        onClick={exportMarginProfitCSV}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Download Itemized Profit and Margin CSV Report"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Export CSV</span>
                      </button>

                      {/* Add Product Button */}
                      <button
                        onClick={() => {
                          resetProductForm();
                          setEditingProduct(null);
                          setIsAddProductOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                    </div>
                  </div>

                  {/* Products Table with Item-Level Profit & Margin */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-3 py-3">Category</th>
                            <th className="px-3 py-3">Cost (COGS)</th>
                            <th className="px-3 py-3">Retail Price</th>
                            <th className="px-3 py-3">Unit Margin</th>
                            <th className="px-3 py-3">Sales Volume</th>
                            <th className="px-3 py-3">Realized Profit</th>
                            <th className="px-3 py-3">Stock Level</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts.map((prod) => {
                            const sales = productSalesMap[prod.id] || {
                              unitsSold: 0,
                              grossRevenue: 0,
                              totalCost: 0,
                              totalProfit: 0,
                            };
                            const cost =
                              typeof prod.cost_price === 'number'
                                ? prod.cost_price
                                : Math.round(prod.price * 0.45 * 100) / 100;
                            const unitProfit = Math.max(0, prod.price - cost);
                            const unitMarginPct = prod.price > 0 ? (unitProfit / prod.price) * 100 : 0;

                            return (
                              <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                                {/* Product thumbnail & title */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={prod.images[0]}
                                      alt={prod.title}
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 leading-tight truncate max-w-[200px]" title={prod.title}>
                                        {prod.title}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-mono text-slate-400">
                                          {prod.sku}
                                        </span>
                                        {prod.featured_badge && (
                                          <span className="px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-700">
                                            {prod.featured_badge}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Category */}
                                <td className="px-3 py-3 text-slate-600 font-medium">
                                  {prod.category_name}
                                </td>

                                {/* Cost Price */}
                                <td className="px-3 py-3 font-mono text-slate-500">
                                  ${(cost ?? 0).toFixed(2)}
                                </td>

                                {/* Retail Price */}
                                <td className="px-3 py-3 font-mono font-bold text-slate-900">
                                  ${(prod.price ?? 0).toFixed(2)}
                                </td>

                                {/* Unit Margin */}
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-semibold text-slate-700">
                                      +${(unitProfit ?? 0).toFixed(2)}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        unitMarginPct >= 50
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : unitMarginPct >= 30
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {(unitMarginPct ?? 0).toFixed(0)}%
                                    </span>
                                  </div>
                                </td>

                                {/* Sales Volume */}
                                <td className="px-3 py-3">
                                  <div>
                                    <span className="font-bold text-slate-900 block">
                                      {sales.unitsSold ?? 0} sold
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      ${(sales.grossRevenue ?? 0).toFixed(2)} gross
                                    </span>
                                  </div>
                                </td>

                                {/* Realized Profit */}
                                <td className="px-3 py-3">
                                  {(sales.unitsSold ?? 0) > 0 ? (
                                    <div>
                                      <span className="font-bold font-mono text-xs text-emerald-600 block">
                                        +${(sales.totalProfit ?? 0).toFixed(2)}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        {sales.grossRevenue > 0
                                          ? (((sales.totalProfit ?? 0) / sales.grossRevenue) * 100).toFixed(1)
                                          : '0.0'}% realized
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[11px] italic">0 orders</span>
                                  )}
                                </td>

                                {/* Stock Level */}
                                <td className="px-3 py-3">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                      prod.inventory_count <= 0
                                        ? 'bg-red-100 text-red-800'
                                        : prod.inventory_count <= 10
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {prod.inventory_count} in stock
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingProduct(prod);
                                        setProductForm({
                                          title: prod.title,
                                          description: prod.description,
                                          price: prod.price.toString(),
                                          compare_at_price: prod.compare_at_price?.toString() || '',
                                          cost_price: prod.cost_price?.toString() || '',
                                          category_id: prod.category_id,
                                          inventory_count: prod.inventory_count.toString(),
                                          sku: prod.sku,
                                          images: prod.images[0] || '',
                                          featured_badge: prod.featured_badge || ('' as any),
                                        });
                                        setIsAddProductOpen(true);
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Product and COGS"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(prod.id)}
                                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CATEGORIES MANAGEMENT */}
              {activeTab === 'categories' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Product Categories</h3>
                      <p className="text-xs text-slate-500">
                        Organize your store catalog into shopper departments
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({
                          name: '',
                          slug: '',
                          description: '',
                          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
                          icon_name: 'Layers',
                        });
                        setIsAddCategoryOpen(true);
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => {
                      const count = products.filter((p) => p.category_id === cat.id).length;
                      return (
                        <div
                          key={cat.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                        >
                          <div className="h-32 bg-slate-100 relative overflow-hidden">
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent flex items-end p-4">
                              <div>
                                <h4 className="text-base font-bold text-white leading-tight">
                                  {cat.name}
                                </h4>
                                <span className="text-[11px] text-blue-200 font-mono">
                                  slug: {cat.slug}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                              {cat.description}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                                {count} Products Active
                              </span>

                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setCategoryForm({
                                      name: cat.name,
                                      slug: cat.slug,
                                      description: cat.description,
                                      image_url: cat.image_url,
                                      icon_name: cat.icon_name || 'Layers',
                                    });
                                    setIsAddCategoryOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                  title="Edit Category"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: DELIVERIES & SHIPMENT TRACKING */}
              {activeTab === 'deliveries' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Orders & Delivery Tracking
                      </h3>
                      <p className="text-xs text-slate-500">
                        Dispatch orders, update tracking numbers, and log carrier waypoints
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Filter status:</span>
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none font-semibold"
                      >
                        <option value="all">All Statuses ({orders.length})</option>
                        <option value="placed">Placed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="in_transit">In Transit</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Order & Customer</th>
                            <th className="px-4 py-3">Items</th>
                            <th className="px-4 py-3">Total Paid</th>
                            <th className="px-4 py-3">Carrier & Tracking</th>
                            <th className="px-4 py-3">Delivery Status</th>
                            <th className="px-4 py-3 text-right">Update Delivery</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-mono font-bold text-slate-900">
                                  {ord.order_number}
                                </p>
                                <p className="text-slate-600 font-medium">{ord.customer_name}</p>
                                <p className="text-[11px] text-slate-400">{ord.customer_email}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-slate-800">
                                  {ord.items.length} item(s)
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-extrabold text-blue-600 text-sm block">
                                  ${(ord.total ?? 0).toFixed(2)}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      ord.payment_status === 'paid'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {ord.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                  </span>
                                  {ord.payment_status !== 'paid' && (
                                    <button
                                      onClick={() => handleMarkOrderPaid(ord.id)}
                                      className="px-1.5 py-0.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[10px] font-bold cursor-pointer transition-colors border border-blue-200"
                                      title="Mark as paid to immediately reflect in sales metrics"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800">
                                  {ord.carrier || 'BlueLogistics'}
                                </p>
                                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {ord.tracking_number || 'Unassigned'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                                    ord.order_status === 'delivered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : ord.order_status === 'in_transit' ||
                                        ord.order_status === 'out_for_delivery'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {ord.order_status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleOpenManageDelivery(ord)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Manage Tracking</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: RESTOCK ALERTS */}
              {activeTab === 'alerts' && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Total Alert Requests
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 font-mono">
                        {restockAlerts.length}
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Pending Notification
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-amber-600 font-mono">
                        {restockAlerts.filter((a) => !a.notified).length}
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Fulfilled / Notified
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-emerald-600 font-mono">
                        {restockAlerts.filter((a) => a.notified).length}
                      </p>
                    </div>
                  </div>

                  {/* Restock Alerts Table */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Customer Restock Alert Subscriptions
                        </h2>
                        <p className="text-xs text-slate-500">
                          Real-time requests saved directly to Firestore. Notifications trigger automatically when inventory is replenished.
                        </p>
                      </div>
                      <button
                        onClick={loadAllData}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Refresh
                      </button>
                    </div>

                    {restockAlerts.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-semibold">No restock alert requests yet</p>
                        <p className="text-xs mt-1">
                          When shoppers sign up on out-of-stock items, requests appear here immediately.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-3.5 px-4">Product</th>
                              <th className="py-3.5 px-4">Customer Email</th>
                              <th className="py-3.5 px-4">Requested Date</th>
                              <th className="py-3.5 px-4">Current Stock</th>
                              <th className="py-3.5 px-4">Status</th>
                              <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {restockAlerts.map((alert) => {
                              const prod = products.find((p) => p.id === alert.productId);
                              const inStock = (prod?.inventory_count ?? 0) > 0;
                              return (
                                <tr key={alert.id} className="hover:bg-slate-50/60">
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-900">
                                      {alert.productTitle || prod?.title || alert.productId}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      ID: {alert.productId}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 font-medium text-slate-700 flex items-center gap-1.5 mt-2">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{alert.email}</span>
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500">
                                    {new Date(alert.createdAt).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                        inStock
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}
                                    >
                                      {prod ? `${prod.inventory_count} in stock` : 'Unknown'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {alert.notified ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Notified</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold text-[10px]">
                                        <Clock className="w-3 h-3" />
                                        <span>Waiting for stock</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {inStock && !alert.notified && (
                                        <button
                                          onClick={async () => {
                                            await storeService.triggerRestockNotifications(alert.productId);
                                            await loadAllData();
                                          }}
                                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                                        >
                                          <Bell className="w-3 h-3" />
                                          <span>Send Alert</span>
                                        </button>
                                      )}
                                      {prod && (
                                        <button
                                          onClick={() => {
                                            setEditingProduct(prod);
                                            setProductForm({
                                              title: prod.title,
                                              description: prod.description,
                                              price: prod.price.toString(),
                                              compare_at_price: prod.compare_at_price?.toString() || '',
                                              cost_price: prod.cost_price?.toString() || '',
                                              category_id: prod.category_id,
                                              inventory_count: prod.inventory_count.toString(),
                                              sku: prod.sku,
                                              images: prod.images?.[0] || '',
                                              featured_badge: prod.featured_badge || ('' as any),
                                            });
                                            setIsAddProductOpen(true);
                                          }}
                                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                                        >
                                          Edit Stock
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: RETURNS & WIDERRUF (§ 355 BGB) */}
              {activeTab === 'returns' && (
                <div className="space-y-6">
                  {/* Returns Metrics Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Gesamte Retouren
                        </span>
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {returnsList.length}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Gesetzlich erfasste Rücksendeanträge
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                          Offen / Angefordert
                        </span>
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-amber-600 tracking-tight">
                        {returnsList.filter((r) => r.status === 'requested').length}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Wartet auf Händlerprüfung
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                          Paket Unterwegs
                        </span>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <Truck className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-blue-600 tracking-tight">
                        {returnsList.filter((r) => r.status === 'in_transit' || r.status === 'approved').length}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        DHL & Hermes Rücksendungen
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                          Erstattet / Erledigt
                        </span>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                        {returnsList.filter((r) => r.status === 'refunded').length}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Rückabwicklung abgeschlossen
                      </p>
                    </div>
                  </div>

                  {/* Main Returns Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">
                            Widerrufs- & Retourenverwaltung (§ 355 BGB)
                          </h2>
                          <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            DE Compliance
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Prüfen Sie Retourenaufträge, DHL/Hermes-Sendungsnummern und buchen Sie Rückerstattungen.
                        </p>
                      </div>

                      {/* Filter Controls */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Carrier Filter */}
                        <select
                          value={returnCarrierFilter}
                          onChange={(e) => setReturnCarrierFilter(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none cursor-pointer"
                        >
                          <option value="all">Alle Versanddienstleister</option>
                          <option value="DHL">DHL Retoure (GoGreen)</option>
                          <option value="Hermes">Hermes Retoure (PaketShop)</option>
                        </select>

                        {/* Status Filter */}
                        <select
                          value={returnStatusFilter}
                          onChange={(e) => setReturnStatusFilter(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none cursor-pointer"
                        >
                          <option value="all">Alle Status</option>
                          <option value="requested">Angefordert (Offen)</option>
                          <option value="approved">Genehmigt</option>
                          <option value="in_transit">Unterwegs</option>
                          <option value="refunded">Erstattet</option>
                          <option value="rejected">Abgelehnt</option>
                        </select>
                      </div>
                    </div>

                    {/* Filtered Returns Table / Cards */}
                    {returnsList
                      .filter((r) => {
                        const matchesStatus =
                          returnStatusFilter === 'all' || r.status === returnStatusFilter;
                        const matchesCarrier =
                          returnCarrierFilter === 'all' ||
                          (returnCarrierFilter === 'DHL' && (r.carrier === 'DHL' || !r.carrier)) ||
                          (returnCarrierFilter === 'Hermes' && r.carrier === 'Hermes');
                        return matchesStatus && matchesCarrier;
                      })
                      .length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        <RotateCcw className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">Keine Retouren gefunden</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Aktuell liegen keine Anträge für die gewählte Filterung vor.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {returnsList
                          .filter((r) => {
                            const matchesStatus =
                              returnStatusFilter === 'all' || r.status === returnStatusFilter;
                            const matchesCarrier =
                              returnCarrierFilter === 'all' ||
                              (returnCarrierFilter === 'DHL' && (r.carrier === 'DHL' || !r.carrier)) ||
                              (returnCarrierFilter === 'Hermes' && r.carrier === 'Hermes');
                            return matchesStatus && matchesCarrier;
                          })
                          .map((ret) => {
                            const totalRefund = ret.items.reduce(
                              (sum, it) => sum + it.price * it.quantity,
                              0
                            );
                            const carrierName = ret.carrier || 'DHL';
                            const trackingLink =
                              carrierName === 'Hermes'
                                ? `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/${ret.tracking_number}`
                                : `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${ret.tracking_number}`;

                            return (
                              <div
                                key={ret.id}
                                className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-5 transition-colors hover:border-purple-300 space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                        {ret.rma_code}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-900">
                                        Bestellung {ret.order_number}
                                      </span>
                                      <span
                                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                          ret.status === 'refunded'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : ret.status === 'in_transit'
                                            ? 'bg-blue-100 text-blue-800'
                                            : ret.status === 'approved'
                                            ? 'bg-sky-100 text-sky-800'
                                            : ret.status === 'rejected'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {ret.status === 'refunded'
                                          ? 'Erstattet'
                                          : ret.status === 'in_transit'
                                          ? 'In Zustellung'
                                          : ret.status === 'approved'
                                          ? 'Genehmigt'
                                          : ret.status === 'rejected'
                                          ? 'Abgelehnt'
                                          : 'Angefordert'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                      Kunde: <strong className="text-slate-700">{ret.customer_email}</strong> • Eingereicht am{' '}
                                      {new Date(ret.created_at).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                                        Erstattungsbetrag
                                      </span>
                                      <span className="text-sm font-extrabold text-slate-900">
                                        {totalRefund.toFixed(2)} €
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Carrier, Reason & Items row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                                        Versanddienst & Retourenlabel
                                      </span>
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                          carrierName === 'Hermes'
                                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                                        }`}
                                      >
                                        {carrierName === 'Hermes' ? 'Hermes PaketShop' : 'DHL GoGreen'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                      <div className="font-mono text-xs text-slate-800 font-semibold flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{ret.tracking_number || 'Keine ID'}</span>
                                      </div>
                                      {ret.tracking_number && (
                                        <a
                                          href={trackingLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 text-[11px] hover:underline"
                                        >
                                          <span>Tracking</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>

                                    <div className="pt-1 text-[11px] text-slate-600">
                                      <strong className="text-slate-700">Widerrufsgrund: </strong>
                                      {ret.reason}
                                    </div>
                                  </div>

                                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                                      Betroffene Artikel ({ret.items.length})
                                    </span>
                                    <div className="space-y-1 max-h-20 overflow-y-auto">
                                      {ret.items.map((it, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between text-xs text-slate-700"
                                        >
                                          <span className="truncate max-w-[200px] font-medium">
                                            {it.title}
                                          </span>
                                          <span className="text-slate-500 font-mono">
                                            {it.quantity}x {it.price.toFixed(2)} €
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Status update action buttons */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Gutschrift wird gemäß § 357 BGB auf Original-Zahlungsart gebucht</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {ret.status === 'requested' && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateReturnStatus(ret.id, 'approved')}
                                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                                        >
                                          Retoure genehmigen
                                        </button>
                                        <button
                                          onClick={() => handleUpdateReturnStatus(ret.id, 'rejected')}
                                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold cursor-pointer transition-colors"
                                        >
                                          Ablehnen
                                        </button>
                                      </>
                                    )}

                                    {(ret.status === 'approved' || ret.status === 'in_transit') && (
                                      <button
                                        onClick={() => handleUpdateReturnStatus(ret.id, 'refunded')}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Ware erhalten & Erstattung verbuchen</span>
                                      </button>
                                    )}

                                    {ret.status === 'refunded' && (
                                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Erstattung erfolgreich abgeschlossen</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: VERCEL & SUPABASE GUIDE */}
              {activeTab === 'setup' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase mb-2">
                        <Database className="w-3.5 h-3.5" />
                        <span>Production Deployment Guide</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">
                        How to Run Locally, Connect Supabase, and Deploy to Vercel
                      </h2>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        BlueCart is designed with hybrid persistence: it works instantly right now
                        with full interactive features (catalog, carts, Stripe payments, tracking,
                        and analytics), and is 100% pre-configured for Supabase and Vercel.
                      </p>
                    </div>

                    {/* Step 1: Run locally */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                          1
                        </span>
                        Running Locally on Your Computer
                      </h3>
                      <p className="text-xs text-slate-600 mb-3">
                        Clone or export the project to your computer and run:
                      </p>
                      <pre className="p-3 bg-slate-900 text-blue-200 text-xs rounded-xl font-mono overflow-x-auto">
                        npm install{'\n'}npm run dev
                      </pre>
                      <p className="text-xs text-slate-500 mt-2">
                        The Express server and Vite development bundler will launch at{' '}
                        <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">
                          http://localhost:3000
                        </code>
                      </p>
                    </div>

                    {/* Step 2: Supabase database setup */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                          2
                        </span>
                        Configuring Supabase Backend
                      </h3>
                      <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 mb-3">
                        <li>
                          Create a free database at{' '}
                          <a
                            href="https://supabase.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline font-semibold"
                          >
                            supabase.com
                          </a>
                        </li>
                        <li>
                          Open <strong>SQL Editor</strong> in your Supabase project dashboard.
                        </li>
                        <li>
                          Copy and paste the contents of{' '}
                          <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-mono">
                            supabase-schema.sql
                          </code>{' '}
                          (located in this project root) and click <strong>Run</strong>.
                        </li>
                        <li>
                          Add your project URL and anon key to <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-mono">.env</code>:
                        </li>
                      </ol>
                      <pre className="p-3 bg-slate-900 text-emerald-300 text-xs rounded-xl font-mono overflow-x-auto">
                        VITE_SUPABASE_URL="https://your-project-ref.supabase.co"{'\n'}
                        VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      </pre>
                    </div>

                    {/* Step 3: Vercel deployment */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                          3
                        </span>
                        Deploying to Vercel (1-Click Ready)
                      </h3>
                      <p className="text-xs text-slate-600 mb-3">
                        A ready-to-deploy <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">vercel.json</code> is included.
                      </p>
                      <pre className="p-3 bg-slate-900 text-blue-200 text-xs rounded-xl font-mono overflow-x-auto">
                        # Install Vercel CLI (or push to GitHub and import via vercel.com){'\n'}
                        npm i -g vercel{'\n'}
                        vercel deploy --prod
                      </pre>
                      <p className="text-xs text-slate-500 mt-2">
                        Under Vercel project Settings &gt; Environment Variables, add{' '}
                        <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">
                          STRIPE_SECRET_KEY
                        </code>
                        ,{' '}
                        <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">
                          VITE_SUPABASE_URL
                        </code>
                        , and{' '}
                        <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">
                          VITE_SUPABASE_ANON_KEY
                        </code>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL: ADD / EDIT PRODUCT */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className="fixed inset-0"
              onClick={() => setIsAddProductOpen(false)}
            />
            <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Retail Product'}
                </h3>
                <button
                  onClick={() => setIsAddProductOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="e.g. Cobalt Horizon Smart Watch"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Department</label>
                    <select
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">SKU Code</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="BC-AU-105"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Retail Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="149.99"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Unit Cost (COGS) ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.cost_price}
                      onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                      placeholder="e.g. 67.50"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Stock Count</label>
                    <input
                      type="number"
                      required
                      value={productForm.inventory_count}
                      onChange={(e) =>
                        setProductForm({ ...productForm, inventory_count: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Live Margin Calculation Preview */}
                {(() => {
                  const p = parseFloat(productForm.price) || 0;
                  const c = productForm.cost_price
                    ? parseFloat(productForm.cost_price)
                    : p > 0
                    ? Math.round(p * 0.45 * 100) / 100
                    : 0;
                  const unitProfit = Math.max(0, p - c);
                  const marginPct = p > 0 ? (unitProfit / p) * 100 : 0;
                  return (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Percent className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Unit Profit: <strong className="text-emerald-700 font-mono font-bold">${(unitProfit ?? 0).toFixed(2)}</strong></span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          marginPct >= 50
                            ? 'bg-emerald-100 text-emerald-800'
                            : marginPct >= 30
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {(marginPct ?? 0).toFixed(1)}% Gross Margin
                      </span>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Featured Badge</label>
                  <select
                    value={productForm.featured_badge}
                    onChange={(e) => setProductForm({ ...productForm, featured_badge: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="">None (Standard)</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="New">New Arrival</option>
                    <option value="Sale">On Sale</option>
                    <option value="Featured">Featured</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Image URL</label>
                  <input
                    type="url"
                    required
                    value={productForm.images}
                    onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="High-grade materials, ergonomic specs..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT CATEGORY */}
        {isAddCategoryOpen && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className="fixed inset-0"
              onClick={() => setIsAddCategoryOpen(false)}
            />
            <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Add New Department Category'}
                </h3>
                <button
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g. Footwear & Boots"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Slug</label>
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    placeholder="footwear-boots"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    required
                    value={categoryForm.image_url}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, image_url: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                    placeholder="Collection summary for shoppers..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: MANAGE DELIVERY TIMELINE & TRACKING */}
        {managingDeliveryOrder && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className="fixed inset-0"
              onClick={() => setManagingDeliveryOrder(null)}
            />
            <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Update Delivery Milestone</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Order: {managingDeliveryOrder.order_number}
                  </p>
                </div>
                <button
                  onClick={() => setManagingDeliveryOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleApplyDeliveryUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Order Delivery Status
                  </label>
                  <select
                    value={deliveryStatusUpdate}
                    onChange={(e) => setDeliveryStatusUpdate(e.target.value as OrderStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-900 outline-none"
                  >
                    <option value="placed">Placed</option>
                    <option value="processing">Processing (Packing & Picking)</option>
                    <option value="shipped">Shipped (Departed Facility)</option>
                    <option value="in_transit">In Transit (Cross-dock en route)</option>
                    <option value="out_for_delivery">Out for Delivery (On Courier Van)</option>
                    <option value="delivered">Delivered (Handed to Customer)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Carrier Name
                    </label>
                    <input
                      type="text"
                      value={carrierInput}
                      onChange={(e) => setCarrierInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Tracking Code
                    </label>
                    <input
                      type="text"
                      value={trackingNumberInput}
                      onChange={(e) => setTrackingNumberInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Checkpoint Location
                  </label>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Seattle Regional Logistics Depot, WA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Milestone Log Description
                  </label>
                  <input
                    type="text"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="e.g. Package scanned and loaded onto outbound transport truck"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setManagingDeliveryOrder(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                  >
                    Publish Milestone Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
