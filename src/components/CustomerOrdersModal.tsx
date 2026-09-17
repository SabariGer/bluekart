import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { storeService } from '../lib/storeService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  Package,
  Truck,
  ArrowRight,
  ExternalLink,
  Calendar,
  FileText,
  RotateCcw,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (order: Order) => void;
  onViewInvoice: (order: Order) => void;
  onOpenReturns: (order?: Order) => void;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  onTrackOrder,
  onViewInvoice,
  onOpenReturns,
}) => {
  const { user } = useAuth();
  const { language, t, formatPrice } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all');

  useEffect(() => {
    if (isOpen && user) {
      loadOrders();
    }
  }, [isOpen, user]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const all = await storeService.getOrders();
      // Filter for this user or show sample orders
      const userOrders = all.filter(
        (o) =>
          o.user_id === user?.id ||
          (user?.email && o.customer_email.toLowerCase() === user.email.toLowerCase())
      );
      setOrders(userOrders.length > 0 ? userOrders : all);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return o.order_status !== 'delivered' && o.order_status !== 'cancelled';
    if (filter === 'delivered') return o.order_status === 'delivered';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'in_transit':
      case 'out_for_delivery':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'shipped':
        return 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'processing':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    if (language === 'de') {
      switch (status) {
        case 'placed':
          return 'Bestellt';
        case 'processing':
          return 'In Bearbeitung';
        case 'shipped':
          return 'Versendet (DHL)';
        case 'in_transit':
          return 'Im Paketzentrum';
        case 'out_for_delivery':
          return 'In Zustellung';
        case 'delivered':
          return 'Zugestellt';
        case 'cancelled':
          return 'Storniert';
        default:
          return status;
      }
    }
    return status.replace('_', ' ');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'de' ? 'Kundenportal • Bestellungen & Belege' : 'Customer Portal • Orders & Invoices'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'de'
                  ? 'Echtzeit-Verfolgung, Rechnungen nach § 14 UStG und 14-Tage Retourenportal'
                  : 'Real-time tracking, statutory tax invoices, and 14-day return portal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {language === 'de' ? 'Alle Bestellungen' : 'All Orders'} ({orders.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {language === 'de' ? 'Aktiv / Unterwegs' : 'In Transit'}
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filter === 'delivered'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {language === 'de' ? 'Zugestellt' : 'Delivered'}
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenReturns();
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'de' ? 'Retourenportal öffnen' : 'Returns Portal'}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            {language === 'de' ? 'Bestellungen aus Firestore werden geladen...' : 'Loading orders from Firestore...'}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {language === 'de' ? 'Keine passenden Bestellungen gefunden' : 'No orders found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-600 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {order.order_number}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                          order.order_status
                        )}`}
                      >
                        {getStatusLabel(order.order_status)}
                      </span>
                      {order.b2b_vat_id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          B2B Reverse Charge
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        {language === 'de' ? 'Rechnungsbetrag' : 'Total'}
                      </span>
                      <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                        {formatPrice(order.total)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onTrackOrder(order);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{language === 'de' ? 'Verfolgen' : 'Track'}</span>
                    </button>
                  </div>
                </div>

                {/* Items & Shipping Carrier */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500">
                      {language === 'de' ? 'Versanddienst:' : 'Carrier:'}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {order.carrier || 'DHL Express Deutschland'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      {order.tracking_number}
                    </span>
                  </div>

                  {order.is_packstation && (
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                      📦 DHL Packstation {order.packstation_number}
                    </span>
                  )}
                </div>

                {/* Items list */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 overflow-x-auto">
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 text-xs"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded object-cover"
                      />
                      <span className="truncate max-w-[120px] text-slate-700 dark:text-slate-300 font-medium">
                        {item.title}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Statutory Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => {
                      onViewInvoice(order);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'de' ? 'Rechnung anzeigen (§ 14 UStG)' : 'View Tax Invoice'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenReturns(order);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'de' ? '14-Tage Retoure anmelden' : 'Register Return'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
