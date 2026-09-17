import React, { useState, useEffect } from 'react';
import { Order, ReturnRequest } from '../types';
import { storeService } from '../lib/storeService';
import { useLanguage } from '../context/LanguageContext';
import {
  RotateCcw,
  PackageCheck,
  AlertCircle,
  CheckCircle,
  QrCode,
  X,
  Search,
  Printer,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export interface ReturnsPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders?: Order[];
  customerEmail?: string;
  initialOrder?: Order | null;
  onReturnCreated?: (newReturn: ReturnRequest) => void;
}

export const ReturnsPortalModal: React.FC<ReturnsPortalModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  customerEmail = 'karthylock@gmail.com',
  initialOrder = null,
  onReturnCreated,
}) => {
  const { language, formatPrice } = useLanguage();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [availableOrders, setAvailableOrders] = useState<Order[]>(orders);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(initialOrder);
  const [carrier, setCarrier] = useState<'DHL' | 'Hermes'>('DHL');
  const [reason, setReason] = useState('Widerruf gemäß § 355 BGB (ohne Angabe)');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ [productId: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReturn, setGeneratedReturn] = useState<ReturnRequest | null>(null);
  const [returnHistory, setReturnHistory] = useState<ReturnRequest[]>([]);
  const [selectedHistoryReturn, setSelectedHistoryReturn] = useState<ReturnRequest | null>(null);

  // Load orders and history whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;

    loadReturnsHistory();
    loadOrdersList();
  }, [isOpen, customerEmail, orders]);

  // Sync initialOrder if passed or updated
  useEffect(() => {
    if (initialOrder) {
      setSelectedOrder(initialOrder);
    }
  }, [initialOrder]);

  // When selected order changes, auto-select all items by default for convenience
  useEffect(() => {
    if (selectedOrder && selectedOrder.items) {
      const initial: { [id: string]: boolean } = {};
      selectedOrder.items.forEach((it) => {
        initial[it.product_id] = true;
      });
      setSelectedItems(initial);
    }
  }, [selectedOrder]);

  const loadReturnsHistory = async () => {
    try {
      const history = await storeService.getReturns(customerEmail);
      if (history && history.length > 0) {
        setReturnHistory(history);
      } else {
        // Fallback: fetch all returns in store so demo user can see all
        const allReturns = await storeService.getReturns();
        setReturnHistory(allReturns);
      }
    } catch (err) {
      console.warn('Could not load returns history:', err);
    }
  };

  const loadOrdersList = async () => {
    if (orders && orders.length > 0) {
      setAvailableOrders(orders);
      if (!selectedOrder) {
        setSelectedOrder(initialOrder || orders[0]);
      }
      return;
    }

    setIsLoadingOrders(true);
    try {
      const fetched = await storeService.getOrders();
      // Match by customer email if possible, else show all orders for quick testing
      const matching = fetched.filter(
        (o) => o.customer_email?.toLowerCase() === customerEmail.toLowerCase()
      );
      const toShow = matching.length > 0 ? matching : fetched;
      setAvailableOrders(toShow);

      if (!selectedOrder && toShow.length > 0) {
        setSelectedOrder(initialOrder || toShow[0]);
      }
    } catch (err) {
      console.error('Failed to load orders for returns portal:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  if (!isOpen) return null;

  // Filter available orders by search
  const filteredOrders = availableOrders.filter((o) => {
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.items.some((i) => i.title.toLowerCase().includes(q))
    );
  });

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const itemsToReturn = (selectedOrder.items || [])
      .filter((it) => selectedItems[it.product_id])
      .map((it) => ({
        product_id: it.product_id,
        title: it.title,
        quantity: it.quantity,
        price: it.price,
      }));

    if (itemsToReturn.length === 0) {
      alert(
        language === 'de'
          ? 'Bitte wählen Sie mindestens einen Artikel für die Retoure aus.'
          : 'Please select at least one item to return.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const newRet = await storeService.createReturnRequest({
        order_id: selectedOrder.id,
        order_number: selectedOrder.order_number,
        customer_email: selectedOrder.customer_email || customerEmail,
        carrier,
        reason: `${reason}${notes ? ` - ${notes}` : ''}`,
        items: itemsToReturn,
      });

      // Update delivery milestone on order so tracking timeline reflects return
      try {
        await storeService.updateOrderStatus(
          selectedOrder.id,
          'processing',
          language === 'de'
            ? `Widerruf / Retourenantrag eingereicht (${carrier} RMA: ${newRet.rma_code})`
            : `Return request logged (${carrier} RMA: ${newRet.rma_code})`,
          'BlueCart Retourenzentrum'
        );
      } catch (e) {
        console.warn('Could not update order timeline:', e);
      }

      setGeneratedReturn(newRet);
      onReturnCreated?.(newRet);
      loadReturnsHistory();
    } catch (err) {
      console.error('Error submitting return request:', err);
      alert(
        language === 'de'
          ? 'Fehler bei der Erstellung des Retourenauftrags. Bitte erneut versuchen.'
          : 'Error creating return request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="returns-portal-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shadow-xs">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'de'
                    ? '14-Tage Widerrufs- & Retourenportal'
                    : '14-Day Returns & Cancellation Portal'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> § 355 BGB
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'de'
                  ? 'Kostenloser DHL & Hermes Rückversand mit mobilem QR-Code'
                  : 'Free DHL & Hermes prepaid returns with mobile QR pass'}
              </p>
            </div>
          </div>

          <button
            id="close-returns-portal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 flex gap-2 border-b border-slate-100 dark:border-slate-800">
          <button
            id="tab-new-return-btn"
            onClick={() => {
              setActiveTab('create');
              setGeneratedReturn(null);
              setSelectedHistoryReturn(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'de' ? 'Neue Retoure anmelden' : 'Register New Return'}
          </button>
          <button
            id="tab-returns-history-btn"
            onClick={() => {
              setActiveTab('history');
              loadReturnsHistory();
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>{language === 'de' ? 'Bestehende Retouren' : 'Return History'}</span>
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-mono">
              {returnHistory.length}
            </span>
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'create' ? (
            generatedReturn ? (
              /* Success / Return Label QR Pass View */
              <div className="space-y-5 text-center py-2">
                <div className="w-13 h-13 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'de'
                      ? 'Retoure erfolgreich angemeldet!'
                      : 'Return registered successfully!'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {language === 'de'
                      ? `Ihre Rücksendeanfrage wurde im System gespeichert. Bitte nutzen Sie das nachfolgende kostenlose ${
                          generatedReturn.carrier || 'DHL'
                        }-Retourenlabel.`
                      : `Your return has been recorded. Please use the prepaid ${
                          generatedReturn.carrier || 'DHL'
                        } return barcode below.`}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">RMA-Vorgangsnummer:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {generatedReturn.rma_code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Bestellnummer:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {generatedReturn.order_number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Versanddienstleister:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        generatedReturn.carrier === 'Hermes'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {generatedReturn.carrier === 'Hermes' ? 'Hermes PaketShop' : 'DHL Paket (GoGreen)'}
                    </span>
                  </div>
                  {generatedReturn.tracking_number && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Retouren-Sendungsnr.:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {generatedReturn.tracking_number}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      {language === 'de' ? 'Kostenloses Retourenlabel aktiv' : 'Prepaid Return Label Active'}
                    </span>
                  </div>

                  {/* Carrier QR Pass */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center py-2">
                    <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-xs flex flex-col items-center">
                      <QrCode className="w-24 h-24 text-slate-800" />
                      <span className="font-mono text-[10px] text-slate-700 font-bold mt-1">
                        {generatedReturn.carrier === 'Hermes' ? 'HERMES-RET-' : 'DHL-RET-'}
                        {generatedReturn.rma_code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center max-w-xs">
                      {generatedReturn.carrier === 'Hermes'
                        ? language === 'de'
                          ? 'Diesen QR-Code einfach im Hermes PaketShop vorzeigen – kein Drucker erforderlich.'
                          : 'Show this QR code at any Hermes PaketShop – no printer required.'
                        : language === 'de'
                        ? 'Diesen QR-Code in jeder DHL Filiale oder Packstation vorzeigen – der Paketschein wird kostenlos gedruckt.'
                        : 'Show this QR code at any DHL branch or Packstation – label prints for free.'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setActiveTab('history');
                      loadReturnsHistory();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                  >
                    {language === 'de' ? 'Zu meinen Retouren' : 'View in History'}
                  </button>
                  <button
                    onClick={() => setGeneratedReturn(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {language === 'de' ? 'Weiteren Artikel retournieren' : 'Return another order'}
                  </button>
                </div>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'de'
                    ? 'Keine rückgabefähigen Bestellungen gefunden.'
                    : 'No eligible orders found.'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {language === 'de'
                    ? 'Sobald Sie eine Bestellung aufgeben, können Sie hier innerhalb von 14 Tagen einen kostenlosen Rücksendeauftrag anfordern.'
                    : 'Once you place an order, you can register a free return label here within 14 days.'}
                </p>
              </div>
            ) : (
              /* Return Request Form */
              <form onSubmit={handleSubmitReturn} className="space-y-4">
                {/* Order Selector with Search */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'de' ? '1. Bestellung auswählen' : '1. Select Order'}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {availableOrders.length} {language === 'de' ? 'verfügbar' : 'available'}
                    </span>
                  </div>

                  {availableOrders.length > 3 && (
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder={
                          language === 'de'
                            ? 'Bestellnummer oder Artikel suchen...'
                            : 'Search order number or item...'
                        }
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 outline-hidden"
                      />
                    </div>
                  )}

                  <select
                    id="return-order-select"
                    value={selectedOrder?.id || ''}
                    onChange={(e) => {
                      const found = availableOrders.find((o) => o.id === e.target.value);
                      setSelectedOrder(found || null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {filteredOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} • {new Date(o.created_at).toLocaleDateString()} •{' '}
                        {formatPrice(o.total)} ({o.items?.length || 0}{' '}
                        {language === 'de' ? 'Artikel' : 'items'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items to Return */}
                {selectedOrder && selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === 'de'
                        ? '2. Rückzusendende Artikel auswählen'
                        : '2. Select items to return'}
                    </label>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-800/30">
                      {selectedOrder.items.map((it) => (
                        <label
                          key={it.product_id}
                          className="flex items-center justify-between p-2 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 rounded-lg cursor-pointer text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedItems[it.product_id])}
                              onChange={(e) =>
                                setSelectedItems({
                                  ...selectedItems,
                                  [it.product_id]: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            {it.image && (
                              <img
                                src={it.image}
                                alt={it.title}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                {it.title}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {it.quantity}x à {formatPrice(it.price)}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {formatPrice(it.price * it.quantity)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carrier Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'de'
                      ? '3. Versanddienstleister für kostenlose Retoure wählen'
                      : '3. Select prepaid return shipping carrier'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCarrier('DHL')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        carrier === 'DHL'
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-400/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-amber-700 dark:text-amber-400">
                          DHL Paket (GoGreen)
                        </span>
                        {carrier === 'DHL' && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'de'
                          ? 'Packstation & Filiale QR (Kostenlos)'
                          : 'Drop-off & Packstation QR (Free)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCarrier('Hermes')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        carrier === 'Hermes'
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-400/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                          Hermes PaketShop
                        </span>
                        {carrier === 'Hermes' && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'de'
                          ? '16.000+ PaketShops & Mobiler Schein'
                          : '16,000+ PaketShops & Mobile QR'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'de' ? '4. Rückgabegrund' : '4. Reason for Return'}
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Widerruf gemäß § 355 BGB (ohne Angabe)">
                      Widerruf gemäß § 355 BGB (Gesetzliches Widerrufsrecht - ohne Angabe von Gründen)
                    </option>
                    <option value="Artikel gefällt nicht / Erwartungen nicht erfüllt">
                      Artikel gefällt nicht / Erwartungen nicht erfüllt
                    </option>
                    <option value="Falsche Größe oder Passform">Falsche Größe oder Passform</option>
                    <option value="Artikel beschädigt oder defekt (§ 437 BGB Gewährleistung)">
                      Artikel beschädigt oder defekt (§ 437 BGB Gewährleistung)
                    </option>
                    <option value="Falscher Artikel geliefert">Falscher Artikel geliefert</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'de' ? 'Anmerkung (Optional)' : 'Additional Notes (Optional)'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      language === 'de'
                        ? 'Zusätzliche Angaben zur Retoure...'
                        : 'Any additional notes about this return...'
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Statutory Guarantee note (§ 357 BGB) */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    Gemäß § 357 BGB erstatten wir Ihnen den vollen Rechnungsbetrag unverzüglich und
                    spätestens binnen 14 Tagen ab Eingang des Rücksendeantrags auf das ursprüngliche
                    Zahlungsmittel.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    {language === 'de' ? 'Abbrechen' : 'Cancel'}
                  </button>
                  <button
                    id="submit-return-request-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {isSubmitting
                        ? language === 'de'
                          ? 'Wird generiert...'
                          : 'Generating...'
                        : carrier === 'Hermes'
                        ? language === 'de'
                          ? 'Hermes Retourenschein generieren'
                          : 'Generate Hermes Return Pass'
                        : language === 'de'
                        ? 'DHL Retourenlabel generieren'
                        : 'Generate DHL Return Label'}
                    </span>
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Return History tab */
            <div className="space-y-3">
              {returnHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'de'
                      ? 'Bislang keine Retouren angemeldet.'
                      : 'No return requests recorded.'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === 'de'
                      ? 'Hier sehen Sie alle eingereichten Rücksendungen und deren Bearbeitungsstatus.'
                      : 'All your submitted returns and their current status will appear here.'}
                  </p>
                </div>
              ) : (
                returnHistory.map((ret) => (
                  <div
                    key={ret.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {ret.rma_code}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {ret.order_number}
                        </span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            ret.carrier === 'Hermes'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {ret.carrier || 'DHL'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {ret.reason} • {new Date(ret.created_at).toLocaleDateString()}
                      </p>
                      {ret.tracking_number && (
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Tracking: {ret.tracking_number}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        {ret.items?.length || 1}{' '}
                        {language === 'de' ? 'Artikel retourniert' : 'item(s) returned'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider ${
                          ret.status === 'refunded'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : ret.status === 'approved'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : ret.status === 'in_transit'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {ret.status === 'refunded'
                          ? language === 'de'
                            ? 'Erstattet'
                            : 'Refunded'
                          : ret.status === 'approved'
                          ? language === 'de'
                            ? 'Genehmigt'
                            : 'Approved'
                          : ret.status === 'in_transit'
                          ? language === 'de'
                            ? 'Unterwegs'
                            : 'In Transit'
                          : language === 'de'
                          ? 'In Prüfung'
                          : 'Requested'}
                      </span>

                      <button
                        onClick={() => {
                          setGeneratedReturn(ret);
                          setActiveTab('create');
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-[11px] font-semibold cursor-pointer"
                        title="QR Pass anzeigen"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
