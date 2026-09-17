import React from 'react';
import { Order } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const { language, formatPrice } = useLanguage();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = new Date(order.created_at || Date.now()).toLocaleDateString(
    language === 'de' ? 'de-DE' : 'en-GB',
    { day: '2-digit', month: '2-digit', year: 'numeric' }
  );

  const deliveryDate = new Date(
    new Date(order.created_at || Date.now()).getTime() + 86400000 * 2
  ).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const invoiceNum = order.invoice_number || `INV-2026-${order.order_number.replace(/\D/g, '')}`;
  const isB2B = Boolean(order.b2b_vat_id);

  // Statutory calculations
  const netSubtotal = isB2B ? order.subtotal : Math.round((order.subtotal / 1.19) * 100) / 100;
  const vatAmount = isB2B ? 0 : Math.round((order.subtotal - netSubtotal) * 100) / 100;
  const shippingNet = Math.round((order.shipping_cost / 1.19) * 100) / 100;
  const shippingVat = isB2B ? 0 : Math.round((order.shipping_cost - shippingNet) * 100) / 100;
  const totalTax = isB2B ? 0 : vatAmount + shippingVat;
  const finalTotal = isB2B ? netSubtotal + order.shipping_cost - (order.discount || 0) : order.total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Top Action Bar (hidden when printing) */}
        <div className="print:hidden px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-md">
              § 14 UStG Konform
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {language === 'de' ? 'Rechnung' : 'Statutory Invoice'} {invoiceNum}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'de' ? 'Drucken / PDF' : 'Print / PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div id="printable-invoice" className="p-8 sm:p-10 space-y-8 bg-white text-slate-900">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                  B
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">BlueCart</span>
                <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">GmbH</span>
              </div>
              <p className="text-xs text-slate-500">
                BlueCart Retail Technologies GmbH • Friedrichstraße 100 • 10117 Berlin
              </p>
              <p className="text-xs text-slate-500">
                USt-IdNr.: DE318920144 • Amtsgericht Charlottenburg HRB 198234 B
              </p>
            </div>

            <div className="text-right sm:text-right">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {language === 'de' ? 'RECHNUNG' : 'INVOICE'}
              </h1>
              <p className="text-sm font-bold text-blue-600 mt-0.5">{invoiceNum}</p>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'de' ? 'Rechnungsdatum' : 'Invoice Date'}: {invoiceDate}
              </p>
              <p className="text-xs text-slate-500">
                {language === 'de' ? 'Lieferdatum' : 'Delivery Date'}: {deliveryDate}
              </p>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">
                {language === 'de' ? 'Rechnungsempfänger' : 'Bill To'}:
              </p>
              <p className="font-bold text-sm text-slate-900">{order.customer_name}</p>
              {order.is_packstation ? (
                <>
                  <p className="text-slate-600">DHL Packstation {order.packstation_number}</p>
                  <p className="text-slate-600">Postnummer: {order.post_number}</p>
                </>
              ) : (
                <p className="text-slate-600">{order.shipping_address?.street || 'Musterstraße 12'}</p>
              )}
              <p className="text-slate-600">
                {order.shipping_address?.zip || '10115'} {order.shipping_address?.city || 'Berlin'}, {order.shipping_address?.country || 'Deutschland'}
              </p>
              <p className="text-slate-500 mt-1">{order.customer_email}</p>

              {isB2B && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="font-bold text-blue-700">USt-IdNr. (VAT ID): </span>
                  <span className="font-mono text-slate-800">{order.b2b_vat_id}</span>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge gemäß Art. 196 MwSt-SystRL)
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <p className="font-bold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">
                {language === 'de' ? 'Bestelldetails' : 'Order Information'}:
              </p>
              <p className="text-slate-700">
                <span className="font-medium">{language === 'de' ? 'Bestellnummer' : 'Order No'}:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{order.order_number}</span>
              </p>
              <p className="text-slate-700">
                <span className="font-medium">{language === 'de' ? 'Zahlungsart' : 'Payment Method'}:</span>{' '}
                <span className="font-semibold text-slate-900 capitalize">
                  {order.payment_method.replace('_', ' ')}
                </span>
              </p>
              <p className="text-slate-700">
                <span className="font-medium">{language === 'de' ? 'Sendungsverfolgung' : 'Tracking'}:</span>{' '}
                <span className="font-mono font-semibold text-blue-600">{order.tracking_number || 'DHL-DE-PENDING'}</span>
              </p>
              <div className="pt-2 flex sm:justify-end items-center gap-1 text-emerald-700 font-semibold text-xs">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{language === 'de' ? 'Vollständig bezahlt' : 'Paid in full'}</span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 pr-2">Pos</th>
                  <th className="py-2.5 px-2">{language === 'de' ? 'Bezeichnung' : 'Description'}</th>
                  <th className="py-2.5 px-2 text-center">{language === 'de' ? 'Menge' : 'Qty'}</th>
                  <th className="py-2.5 px-2 text-right">{language === 'de' ? 'Einzelpreis (Netto)' : 'Unit Net'}</th>
                  <th className="py-2.5 px-2 text-center">{language === 'de' ? 'MwSt.' : 'VAT'}</th>
                  <th className="py-2.5 pl-2 text-right">{language === 'de' ? 'Gesamt (Brutto)' : 'Total (Gross)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => {
                  const grossItemTotal = item.price * item.quantity;
                  const netItemPrice = isB2B ? item.price : Math.round((item.price / 1.19) * 100) / 100;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 pr-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Art.-Nr.: {item.product_id}</p>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="py-3 px-2 text-right text-slate-600">{formatPrice(netItemPrice)}</td>
                      <td className="py-3 px-2 text-center text-slate-600">{isB2B ? '0%' : '19%'}</td>
                      <td className="py-3 pl-2 text-right font-bold text-slate-900">
                        {formatPrice(isB2B ? netItemPrice * item.quantity : grossItemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t-2 border-slate-200 text-xs">
            <div className="text-slate-500 max-w-sm space-y-1 mb-4 sm:mb-0 text-[11px]">
              <p className="font-semibold text-slate-700">
                {language === 'de' ? 'Hinweise gemäß UStG & BGB:' : 'Statutory Notes:'}
              </p>
              <p>
                {language === 'de'
                  ? 'Der Rechnungsbetrag wurde bereits über die gewählte Zahlungsmethode beglichen. Vielen Dank für Ihren Einkauf!'
                  : 'Invoice settled via selected payment gateway. Thank you for your business!'}
              </p>
              <p className="text-[10px] text-slate-400">
                Widerrufsfrist: 14 Tage ab Erhalt der Ware gemäß § 355 BGB.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>{language === 'de' ? 'Warenwert (Netto)' : 'Subtotal (Net)'}:</span>
                <span>{formatPrice(netSubtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>{language === 'de' ? 'Rabatt' : 'Discount'}:</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>{language === 'de' ? 'Versandkosten (DHL)' : 'Shipping (DHL)'}:</span>
                <span>{order.shipping_cost === 0 ? (language === 'de' ? 'Kostenlos' : 'Free') : formatPrice(order.shipping_cost)}</span>
              </div>

              {!isB2B && (
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'de' ? 'Enthaltene MwSt. (19%)' : 'Incl. 19% VAT'}:</span>
                  <span>{formatPrice(totalTax)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>{language === 'de' ? 'Gesamtbetrag' : 'Total Amount'}:</span>
                <span className="text-blue-700">{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 text-[10px] text-slate-400 text-center flex flex-wrap justify-center gap-x-6 gap-y-1">
            <span>BlueCart Retail Technologies GmbH</span>
            <span>Geschäftsführung: Anna Schmidt, Dr. Felix Weber</span>
            <span>Bankverbindung: Deutsche Bank AG • IBAN: DE89 1007 0000 0123 4567 89</span>
            <span>BIC: DEUTDEDBFXX</span>
          </div>

        </div>
      </div>
    </div>
  );
};
