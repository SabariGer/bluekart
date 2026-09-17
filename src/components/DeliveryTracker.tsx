import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { storeService } from '../lib/storeService';
import { useLanguage } from '../context/LanguageContext';
import {
  Package,
  Search,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface DeliveryTrackerProps {
  initialOrder?: Order | null;
  onClose?: () => void;
}

export const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({ initialOrder, onClose }) => {
  const { language, t, formatPrice } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(
    initialOrder?.tracking_number || initialOrder?.order_number || (language === 'de' ? 'BL-98234812DE' : 'BL-98234812US')
  );
  const [activeOrder, setActiveOrder] = useState<Order | null>(initialOrder || null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const STATUS_STEPS: { status: OrderStatus; label: string; description: string }[] = [
    {
      status: 'placed',
      label: language === 'de' ? 'Bestellt' : 'Order Placed',
      description: language === 'de' ? 'Bestellung bestätigt & bezahlt' : 'Order confirmed & paid',
    },
    {
      status: 'processing',
      label: language === 'de' ? 'Bearbeitung' : 'Processing',
      description: language === 'de' ? 'Im Logistikzentrum verpackt' : 'Packed at fulfillment center',
    },
    {
      status: 'shipped',
      label: language === 'de' ? 'Versendet' : 'Shipped',
      description: language === 'de' ? 'An Paketdienst übergeben' : 'Handed over to carrier',
    },
    {
      status: 'in_transit',
      label: language === 'de' ? 'Transport' : 'In Transit',
      description: language === 'de' ? 'Auf dem Weg zum Ziel-Depot' : 'En route to local depot',
    },
    {
      status: 'out_for_delivery',
      label: language === 'de' ? 'In Zustellung' : 'Out for Delivery',
      description: language === 'de' ? 'Zustellfahrzeug unterwegs' : 'Courier on route',
    },
    {
      status: 'delivered',
      label: language === 'de' ? 'Zugestellt' : 'Delivered',
      description: language === 'de' ? 'Erfolgreich zugestellt' : 'Received by customer',
    },
  ];

  useEffect(() => {
    if (initialOrder) {
      setActiveOrder(initialOrder);
      setSearchQuery(initialOrder.tracking_number || initialOrder.order_number);
    } else {
      handleSearch(language === 'de' ? 'BL-98234812DE' : 'BL-98234812US');
    }
  }, [initialOrder, language]);

  const handleSearch = async (queryToSearch?: string) => {
    const term = (queryToSearch || searchQuery).trim();
    if (!term) return;

    setIsLoading(true);
    setNotFound(false);

    try {
      const found = await storeService.getOrderByTrackingOrNumber(term);
      if (found) {
        setActiveOrder(found);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTracking = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'in_transit':
        return 3;
      case 'out_for_delivery':
        return 4;
      case 'delivered':
        return 5;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIndex = activeOrder ? getStepIndex(activeOrder.order_status) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-4xl mx-auto my-4 sm:my-8 animate-in fade-in duration-150">
      {/* Tracker Header */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 sm:p-8 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {language === 'de' ? 'Live Sendungsverfolgung & Paket-Status' : 'Live Parcel & Delivery Tracker'}
            </h2>
            <p className="text-xs text-blue-200">
              {language === 'de'
                ? 'Echtzeit-Tracking, GPS-Depot-Meilensteine und Zustellinformationen'
                : 'Real-time dispatch milestones, GPS waypoints, and carrier updates'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="mt-6 flex gap-2 max-w-xl"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'de' ? 'Sendungsnummer eingeben (z. B. BL-98234812DE oder Bestell-Nr.)' : 'Enter Tracking Number (e.g. BL-98234812US or Order #)'}
              className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {isLoading ? (language === 'de' ? 'Suche...' : 'Searching...') : (language === 'de' ? 'Verfolgen' : 'Track')}
          </button>
        </form>

        {/* Demo Quick Track links */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-blue-200">
          <span className="text-blue-300/80">{language === 'de' ? 'Muster testen:' : 'Try samples:'}</span>
          <button
            type="button"
            onClick={() => {
              const code = language === 'de' ? 'BL-98234812DE' : 'BL-98234812US';
              setSearchQuery(code);
              handleSearch(code);
            }}
            className="underline hover:text-white cursor-pointer font-mono"
          >
            {language === 'de' ? 'BL-98234812DE (Auf Transportweg)' : 'BL-98234812US (In Transit)'}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              const code = language === 'de' ? 'BL-77192344DE' : 'BL-77192344US';
              setSearchQuery(code);
              handleSearch(code);
            }}
            className="underline hover:text-white cursor-pointer font-mono"
          >
            {language === 'de' ? 'BL-77192344DE (Zugestellt)' : 'BL-77192344US (Delivered)'}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('BC-2026-8912');
              handleSearch('BC-2026-8912');
            }}
            className="underline hover:text-white cursor-pointer font-mono"
          >
            BC-2026-8912 ({language === 'de' ? 'In Bearbeitung' : 'Processing'})
          </button>
        </div>
      </div>

      {notFound && (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {language === 'de' ? 'Keine Sendungsdaten gefunden' : 'No shipment records found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {language === 'de'
              ? 'Bitte überprüfen Sie die Sendungs- oder Bestellnummer. Tracking-Codes entsprechen dem Format BL-XXXXXXXXDE.'
              : 'Please check the tracking number or order ID. Tracking numbers usually follow the format BL-XXXXXXXXUS.'}
          </p>
        </div>
      )}

      {activeOrder && (
        <div className="p-6 sm:p-8 space-y-8">
          {/* Shipment Key Metrics Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-blue-50/50 dark:bg-slate-800/60 p-5 rounded-2xl border border-blue-100 dark:border-slate-700">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider block">
                {language === 'de' ? 'Versanddienst & Service' : 'Carrier & Service'}
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {activeOrder.carrier || (language === 'de' ? 'DHL Express Germany' : 'BlueLogistics Express')}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 dark:border-slate-700 font-semibold">
                  {activeOrder.tracking_number || 'Pending'}
                </span>
                {activeOrder.tracking_number && (
                  <button
                    onClick={() => handleCopyTracking(activeOrder.tracking_number!)}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 cursor-pointer"
                    title="Copy tracking code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              {activeOrder.tracking_number && (
                <a
                  href={
                    (activeOrder.carrier || '').toLowerCase().includes('hermes')
                      ? `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/${activeOrder.tracking_number}`
                      : `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${activeOrder.tracking_number}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  <span>
                    {(activeOrder.carrier || '').toLowerCase().includes('hermes')
                      ? 'Auf myHermes.de öffnen'
                      : 'Auf DHL.de öffnen'}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider block">
                {language === 'de' ? 'Aktueller Status' : 'Current Status'}
              </span>
              <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-600 text-white">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {STATUS_STEPS[Math.max(0, currentStepIndex)]?.label || activeOrder.order_status}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider block">
                {language === 'de' ? 'Voraussichtliche Ankunft' : 'Estimated Delivery'}
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {activeOrder.estimated_delivery || (language === 'de' ? 'Wird berechnet...' : 'Calculating...')}
              </p>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider block">
                {language === 'de' ? 'Zielort' : 'Destination'}
              </span>
              <p className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5 truncate flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                {activeOrder.shipping_address.city}, {activeOrder.shipping_address.state}
              </p>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-6">
              {language === 'de' ? 'Lieferfortschritt' : 'Delivery Progress'}
            </h3>

            <div className="relative">
              {/* Desktop Progress Stepper */}
              <div className="hidden md:flex justify-between items-center relative">
                {/* Connecting Track Line */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 z-0">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{
                      width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.status} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCompleted
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50'
                            : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        {isCompleted && idx < currentStepIndex ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={`text-xs font-semibold mt-2 ${
                          isCurrent
                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                            : isCompleted
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Status View */}
              <div className="md:hidden flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {currentStepIndex + 1}/{STATUS_STEPS.length}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {language === 'de' ? 'Aktueller Meilenstein' : 'Current Milestone'}
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {STATUS_STEPS[Math.max(0, currentStepIndex)]?.label}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  {language === 'de' ? `Schritt ${currentStepIndex + 1}` : `Step ${currentStepIndex + 1}`}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Events Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {language === 'de' ? 'Chronologisches Aktivitäten-Protokoll' : 'Chronological Activity Log'}
            </h3>

            <div className="space-y-4 pl-2 sm:pl-4 border-l-2 border-blue-200 dark:border-blue-900">
              {activeOrder.delivery_history && activeOrder.delivery_history.length > 0 ? (
                activeOrder.delivery_history
                  .slice()
                  .reverse()
                  .map((event, idx) => (
                    <div key={event.id || idx} className="relative pl-6 pb-2">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                          idx === 0 ? 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/50' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      />

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {event.description}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {new Date(event.timestamp).toLocaleString(language === 'de' ? 'de-DE' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-slate-400 pl-4">
                  {language === 'de' ? 'Noch keine Meilensteine aufgezeichnet.' : 'No events logged yet for this order.'}
                </p>
              )}
            </div>
          </div>

          {/* Items Inside Package */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {language === 'de'
                ? `Artikel in dieser Sendung (${activeOrder.items.length})`
                : `Items In This Consignment (${activeOrder.items.length})`}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'de' ? 'Menge:' : 'Qty:'} {item.quantity} • {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
