import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { storeService } from '../lib/storeService';
import { Order, PaymentMethod, PaymentDetails } from '../types';
import { LegalTab } from './LegalModal';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  Check,
  Truck,
  Lock,
  ArrowRight,
  Package,
  AlertCircle,
  Landmark,
  Wallet,
  Building2,
  Smartphone,
  Zap,
  Info,
  Banknote,
  FileText,
  QrCode,
  Receipt,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  onOpenLegalTab?: (tab: LegalTab) => void;
  onViewInvoice?: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  onOpenLegalTab,
  onViewInvoice,
}) => {
  const { items, subtotal, tax, shippingCost, discount, total, clearCart } = useCart();
  const { user } = useAuth();
  const { language, t, formatPrice } = useLanguage();

  // Selected payment method
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('sepa');

  // Customer / Shipping Form state
  const [formData, setFormData] = useState({
    name: user?.name || (language === 'de' ? 'Maximilian Weber' : 'Alex Morgan'),
    email: user?.email || (language === 'de' ? 'kunde@bluecart.store' : 'customer@bluecart.store'),
    phone: user?.phone || (language === 'de' ? '+49 89 1234567' : '+1 (555) 234-5678'),
    street: user?.address?.street || (language === 'de' ? 'Maximilianstraße 12' : '742 Evergreen Terrace'),
    city: user?.address?.city || (language === 'de' ? 'München' : 'Seattle'),
    state: user?.address?.state || (language === 'de' ? 'Bayern' : 'WA'),
    zip: user?.address?.zip || (language === 'de' ? '80539' : '98101'),
    country: user?.address?.country || (language === 'de' ? 'Deutschland' : 'Germany'),
  });

  // Stripe Card state
  const [cardData, setCardData] = useState({
    cardNumber: '4242 4242 4242 4242',
    rawCardNumber: '4242424242424242',
    expiry: '12/28',
    cvc: '342',
    nameOnCard: user?.name || (language === 'de' ? 'Maximilian Weber' : 'Alex Morgan'),
  });

  // SEPA-Lastschrift state
  const [sepaData, setSepaData] = useState({
    accountHolder: user?.name || (language === 'de' ? 'Maximilian Weber' : 'Alex Morgan'),
    iban: 'DE89 3704 0044 0532 0130 00',
    bic: 'BYLADEM1001',
    bankName: 'Stadtsparkasse München',
    mandateAcknowledged: true,
  });

  // PayPal state
  const [paypalData, setPaypalData] = useState({
    email: user?.email || (language === 'de' ? 'kunde.deutschland@beispiel-paypal.de' : 'customer@paypal-demo.com'),
    payLater30Days: false,
  });

  // Klarna state
  const [klarnaData, setKlarnaData] = useState<{
    type: 'invoice' | 'sofort' | 'slice_it';
    birthDate: string;
    phone: string;
  }>({
    type: 'invoice',
    birthDate: '15.04.1992',
    phone: user?.phone || '+49 89 1234567',
  });

  // Giropay / Paydirekt state
  const [giropayData, setGiropayData] = useState({
    bankName: 'Stadtsparkasse München (BLZ 701 500 00)',
  });

  // Vorkasse / Bank Transfer state
  const [bankTransferData, setBankTransferData] = useState({
    senderBank: 'Deutsche Bank AG',
    senderIban: 'DE44 5001 0517 5422 1890 12',
    transferConfirmed: true,
  });

  // Nachnahme (Cash on Delivery DHL) state
  const [codData, setCodData] = useState({
    codServiceFee: 3.90, // Standard German DHL/Hermes Nachnahme fee
    courierPreferred: 'DHL Express Postbote',
    exactCashAvailable: true,
  });

  // Wero (EPI - European Payments Initiative) state
  const [weroData, setWeroData] = useState<{
    identifierType: 'phone' | 'email' | 'qr';
    identifierValue: string;
    participatingBank: string;
  }>({
    identifierType: 'phone',
    identifierValue: user?.phone || '+49 171 8920192',
    participatingBank: 'Sparkasse (EPI Member)',
  });

  // German Law: Mandatory explicit consent checkbox (Opt-in without pre-tick)
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Dynamic COD fee calculation
  // Shipping Carrier selection (German compliance: Choice between DHL and Hermes)
  const [shippingCarrier, setShippingCarrier] = useState<'DHL' | 'Hermes' | 'DHL_EXPRESS'>('DHL');
  const [deliveryType, setDeliveryType] = useState<'home' | 'packstation' | 'paketshop'>('home');
  const [packstationNumber, setPackstationNumber] = useState('');
  const [postNumber, setPostNumber] = useState('');
  const [hermesShopId, setHermesShopId] = useState('');

  const codFee = selectedMethod === 'cash_on_delivery' ? codData.codServiceFee : 0;
  const expressFee = shippingCarrier === 'DHL_EXPRESS' ? 4.90 : 0;
  const payableTotal = Math.round((total + codFee + expressFee) * 100) / 100;

  useEffect(() => {
    if (!isOpen) {
      setCompletedOrder(null);
      setTermsAccepted(false);
      setErrorMessage(null);
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.whatsapp_number || user.phone || prev.phone,
        street: user.address?.street || prev.street,
        city: user.address?.city || prev.city,
        state: user.address?.state || prev.state,
        zip: user.address?.zip || prev.zip,
        country: user.address?.country || prev.country,
      }));
      if (user.address?.packstation) {
        setPackstationNumber(user.address.packstation);
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Dummy test-data auto-fill helpers
  const handleFillTestCard = () => {
    setCardData({
      cardNumber: '4242 4242 4242 4242',
      rawCardNumber: '4242424242424242',
      expiry: '12/28',
      cvc: '342',
      nameOnCard: formData.name || 'Maximilian Weber',
    });
  };

  const handleFillTestSepa = () => {
    setSepaData({
      accountHolder: formData.name || 'Maximilian Weber',
      iban: 'DE89 3704 0044 0532 0130 00',
      bic: 'BYLADEM1001',
      bankName: 'Stadtsparkasse München',
      mandateAcknowledged: true,
    });
  };

  const handleFillTestPaypal = () => {
    setPaypalData({
      email: 'kunde.deutschland@beispiel-paypal.de',
      payLater30Days: false,
    });
  };

  const handleFillTestKlarna = () => {
    setKlarnaData({
      type: 'invoice',
      birthDate: '15.04.1992',
      phone: '+49 89 1234567',
    });
  };

  const handleFillTestGiropay = (bank: string) => {
    setGiropayData({ bankName: bank });
  };

  const handleFillTestBankTransfer = () => {
    setBankTransferData({
      senderBank: 'Deutsche Bank Privatkunden',
      senderIban: 'DE44 5001 0517 5422 1890 12',
      transferConfirmed: true,
    });
  };

  const handleFillTestCod = () => {
    setCodData({
      codServiceFee: 3.90,
      courierPreferred: 'DHL Express Postbote',
      exactCashAvailable: true,
    });
  };

  const handleFillTestWero = () => {
    setWeroData({
      identifierType: 'phone',
      identifierValue: '+49 171 8920192',
      participatingBank: 'Sparkasse (EPI Member)',
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!termsAccepted) {
      setErrorMessage(
        language === 'de'
          ? 'Bitte bestätigen Sie die Allgemeinen Geschäftsbedingungen und die Widerrufsbelehrung, um fortzufahren.'
          : 'Please accept the Terms & Conditions and Cancellation Policy to continue.'
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const orderNumber = `BC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const amountInCents = Math.round(total * 100);
      const isDe = language === 'de';

      let paymentId = `pay_${Date.now()}`;
      let paymentDetails: PaymentDetails = {
        method_name: 'Zahlung',
      };
      let statusDescription = '';

      // Execute appropriate backend route or simulated sandbox
      if (selectedMethod === 'stripe') {
        try {
          const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amountInCents,
              currency: 'eur',
              orderId: orderNumber,
              customerEmail: formData.email,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            paymentId = data.paymentIntentId || paymentId;
          }
        } catch {
          // fallback
        }
        paymentDetails = {
          method_name: isDe ? 'Kredit- / Debitkarte (Stripe)' : 'Credit / Debit Card (Stripe)',
          transaction_id: paymentId,
        };
        statusDescription = isDe
          ? `Zahlung autorisiert via Stripe Gateway (${formatPrice(total)})`
          : `Payment authorized via Stripe Gateway (${formatPrice(total)})`;
      } else if (selectedMethod === 'sepa') {
        try {
          const response = await fetch('/api/sepa/authorize-mandate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              iban: sepaData.iban,
              bic: sepaData.bic,
              accountHolder: sepaData.accountHolder,
              customerEmail: formData.email,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            paymentId = data.mandate_reference || `BC-SEPA-${Date.now().toString().slice(-8)}`;
          }
        } catch {
          // fallback
        }
        const last4 = sepaData.iban.replace(/\s+/g, '').slice(-4);
        paymentDetails = {
          method_name: 'SEPA-Basislastschrift (Bankeinzug)',
          transaction_id: paymentId,
          mandate_ref: paymentId,
          iban_last4: last4,
          bank_name: sepaData.bankName,
        };
        statusDescription = isDe
          ? `SEPA-Basislastschrift erteilt (Mandat: ${paymentId}, Gläubiger-ID: DE98ZZZ09999999999)`
          : `SEPA Direct Debit mandate issued (Mandate: ${paymentId})`;
      } else if (selectedMethod === 'paypal') {
        try {
          const response = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: total,
              currency: 'EUR',
              orderId: orderNumber,
              customerEmail: formData.email,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            paymentId = data.id || paymentId;
          }
        } catch {
          // fallback
        }
        paymentDetails = {
          method_name: paypalData.payLater30Days
            ? (isDe ? 'PayPal (Später Bezahlen in 30 Tagen)' : 'PayPal (Pay in 30 Days)')
            : 'PayPal Express Checkout',
          transaction_id: paymentId,
          paypal_email: paypalData.email,
        };
        statusDescription = isDe
          ? `Zahlung bestätigt via PayPal Käuferschutz (${paypalData.email})`
          : `Payment confirmed via PayPal Buyer Protection (${paypalData.email})`;
      } else if (selectedMethod === 'klarna') {
        try {
          const response = await fetch('/api/klarna/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: total,
              currency: 'EUR',
              purchaseType: klarnaData.type,
              customerEmail: formData.email,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            paymentId = data.session_id || paymentId;
          }
        } catch {
          // fallback
        }
        const klarnaLabelMap = {
          invoice: isDe ? 'Klarna. Kauf auf Rechnung (Zahlungsziel 30 Tage)' : 'Klarna. Pay Later in 30 Days',
          sofort: isDe ? 'Klarna. Sofortüberweisung' : 'Klarna. Sofort Online Banking',
          slice_it: isDe ? 'Klarna. Ratenkauf' : 'Klarna. Slice It',
        };
        paymentDetails = {
          method_name: klarnaLabelMap[klarnaData.type] || 'Klarna',
          transaction_id: paymentId,
          klarna_type: klarnaData.type,
        };
        statusDescription = isDe
          ? `Zahlungsanspruch verifiziert via ${klarnaLabelMap[klarnaData.type]}`
          : `Payment verified via ${klarnaLabelMap[klarnaData.type]}`;
      } else if (selectedMethod === 'giropay') {
        try {
          const response = await fetch('/api/giropay/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bankName: giropayData.bankName,
              customerEmail: formData.email,
              amount: total,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            paymentId = data.transaction_id || paymentId;
          }
        } catch {
          // fallback
        }
        paymentDetails = {
          method_name: 'Giropay / Wero (Deutsche Kreditwirtschaft)',
          transaction_id: paymentId,
          bank_name: giropayData.bankName,
        };
        statusDescription = isDe
          ? `Direktüberweisung über ${giropayData.bankName} gebucht`
          : `Direct bank transfer authorized via ${giropayData.bankName}`;
      } else if (selectedMethod === 'apple_pay') {
        paymentId = `APAY-DE-${Date.now().toString().slice(-6)}`;
        paymentDetails = {
          method_name: 'Apple Pay / Google Pay Express',
          transaction_id: paymentId,
        };
        statusDescription = isDe
          ? 'Biometrisch autorisiert via Secure Element (Face ID / Touch ID)'
          : 'Biometrically authorized via Secure Element';
      } else if (selectedMethod === 'bank_transfer') {
        try {
          const response = await fetch('/api/bank-transfer/create-reference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: payableTotal,
              currency: 'EUR',
              customer_email: formData.email,
              order_number: orderNumber,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            paymentId = data.payment_reference || paymentId;
          }
        } catch {
          paymentId = `BC-VORKASSE-${Date.now().toString().slice(-6)}`;
        }
        paymentDetails = {
          method_name: isDe ? 'Vorkasse / Banküberweisung' : 'Bank Transfer (Pre-payment)',
          transaction_id: paymentId,
          reference_code: paymentId,
          recipient_iban: 'DE21 5007 0010 0123 4567 89',
          recipient_bic: 'DEUTDEDDFXX',
          bank_name: 'Deutsche Bank AG Frankfurt',
        };
        statusDescription = isDe
          ? `Vorkasse-Auftrag angelegt (Ref: ${paymentId}). Bitte an Deutsche Bank AG überweisen.`
          : `Bank transfer order created (Ref: ${paymentId}). Awaiting wire deposit.`;
      } else if (selectedMethod === 'cash_on_delivery') {
        try {
          const response = await fetch('/api/cash-on-delivery/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: payableTotal,
              currency: 'EUR',
              customer_name: formData.name,
              order_number: orderNumber,
              courier: codData.courierPreferred,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            paymentId = data.transaction_id || paymentId;
          }
        } catch {
          paymentId = `COD-DHL-${Date.now().toString().slice(-6)}`;
        }
        paymentDetails = {
          method_name: isDe ? 'Nachnahme (Barzahlung bei DHL-Zustellung)' : 'Cash on Delivery (DHL)',
          transaction_id: paymentId,
          cod_fee: codData.codServiceFee,
          courier: codData.courierPreferred,
        };
        statusDescription = isDe
          ? `Nachnahme registriert (+3,90 € Gebühr). ${formatPrice(payableTotal)} bei Paketübergabe an Zusteller.`
          : `Cash on delivery authorized. Pay courier upon delivery.`;
      } else if (selectedMethod === 'wero') {
        try {
          const response = await fetch('/api/wero/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: payableTotal,
              currency: 'EUR',
              identifier: weroData.identifierValue,
              identifier_type: weroData.identifierType,
              bank: weroData.participatingBank,
              order_number: orderNumber,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            paymentId = data.transaction_id || paymentId;
          }
        } catch {
          paymentId = `WERO-EPI-${Date.now().toString().slice(-6)}`;
        }
        paymentDetails = {
          method_name: 'Wero (EPI European Payments Initiative)',
          transaction_id: paymentId,
          bank_name: weroData.participatingBank,
        };
        statusDescription = isDe
          ? `Wero Echtzeit-Bankzahlung bestätigt via ${weroData.participatingBank}`
          : `Wero instant bank payment authorized via ${weroData.participatingBank}`;
      }

      // Generate carrier name, tracking number & estimated delivery based on selected carrier
      let carrierName = 'DHL Paket (GoGreen)';
      let trackingNumber = `00340434${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const estDate = new Date();

      if (shippingCarrier === 'Hermes') {
        carrierName = 'Hermes Deutschland';
        trackingNumber = `H${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
        estDate.setDate(estDate.getDate() + 3);
      } else if (shippingCarrier === 'DHL_EXPRESS') {
        carrierName = 'DHL Express Germany';
        trackingNumber = `DHL-EXP-${Math.floor(1000000000 + Math.random() * 9000000000)}DE`;
        estDate.setDate(estDate.getDate() + 1);
      } else {
        carrierName = 'DHL Paket (GoGreen)';
        trackingNumber = `00340434${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        estDate.setDate(estDate.getDate() + 2);
      }
      const estDeliveryStr = estDate.toISOString().split('T')[0];

      // Address formatting for Packstation / Hermes PaketShop
      let finalStreet = formData.street;
      if (deliveryType === 'packstation' && shippingCarrier.startsWith('DHL')) {
        finalStreet = `Packstation ${packstationNumber || '142'} (PostNr: ${postNumber || '91827364'}), ${formData.street}`;
      } else if (deliveryType === 'paketshop' && shippingCarrier === 'Hermes') {
        finalStreet = `Hermes PaketShop (${hermesShopId || 'Shop-80539'}), ${formData.street}`;
      }

      // Build Order Object
      const newOrder = await storeService.createOrder({
        order_number: orderNumber,
        user_id: user?.id || 'guest_user',
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: {
          street: finalStreet,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
        items: items.map((i) => ({
          product_id: i.product.id,
          title: i.product.title,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.images[0],
        })),
        subtotal,
        tax,
        shipping_cost: shippingCost + expressFee,
        discount,
        total: payableTotal,
        payment_method: selectedMethod,
        payment_status: selectedMethod === 'bank_transfer' ? 'pending' : (selectedMethod === 'cash_on_delivery' ? 'pending' : 'paid'),
        stripe_payment_id: paymentId,
        payment_details: paymentDetails,
        order_status: 'processing',
        tracking_number: trackingNumber,
        carrier: carrierName,
        estimated_delivery: estDeliveryStr,
        delivery_history: [
          {
            id: `del_${Date.now()}_1`,
            timestamp: new Date().toISOString(),
            status: 'placed',
            location: isDe ? 'BlueCart Flagship Terminal München' : 'BlueCart Storefront',
            description: statusDescription,
          },
          {
            id: `del_${Date.now()}_2`,
            timestamp: new Date().toISOString(),
            status: 'processing',
            location: isDe ? 'Paketzentrum München / Aschheim' : 'Regional Logistics Center',
            description: isDe
              ? `Bestellung verifiziert. Versanddienstleister: ${carrierName} (${trackingNumber})`
              : `Order verified. Carrier assigned: ${carrierName} (${trackingNumber})`,
          },
        ],
      });

      // Clear Cart
      clearCart();

      // Trigger Confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#38bdf8', '#1e40af', '#10b981'],
      });

      setCompletedOrder(newOrder);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(
        err.message ||
          (language === 'de'
            ? 'Zahlung fehlgeschlagen. Bitte erneut versuchen.'
            : 'Payment processing failed. Please try again.')
      );
      setIsProcessing(false);
    }
  };

  const getProcessingText = () => {
    if (language === 'de') {
      switch (selectedMethod) {
        case 'sepa':
          return 'SEPA-Lastschriftmandat wird generiert & geprüft...';
        case 'paypal':
          return 'Sichere Verbindung zu PayPal wird hergestellt...';
        case 'klarna':
          return 'Klarna Identitäts- & Bonitätsprüfung läuft...';
        case 'giropay':
          return 'Online-Banking Schnittstelle wird autorisiert...';
        case 'apple_pay':
          return 'Biometrische Wallet-Bestätigung wird verarbeitet...';
        case 'bank_transfer':
          return 'Offizielle Vorkasse-Zahlungsdaten & Verwendungszweck werden generiert...';
        case 'cash_on_delivery':
          return 'DHL-Nachnahmeauftrag wird für Zustellung autorisiert...';
        case 'wero':
          return 'Wero (EPI) Echtzeit-Bankverbindung wird autorisiert...';
        default:
          return 'Autorisierung über Stripe Gateway...';
      }
    }
    switch (selectedMethod) {
      case 'sepa':
        return 'Authorizing SEPA Direct Debit mandate...';
      case 'paypal':
        return 'Connecting to PayPal secure checkout...';
      case 'klarna':
        return 'Verifying with Klarna credit gateway...';
      case 'giropay':
        return 'Redirecting to German online banking portal...';
      case 'apple_pay':
        return 'Processing Wallet authorization...';
      case 'bank_transfer':
        return 'Generating bank transfer reference & account details...';
      case 'cash_on_delivery':
        return 'Booking Cash on Delivery fulfillment with courier...';
      case 'wero':
        return 'Authorizing Wero instant bank payment...';
      default:
        return 'Authorizing via Stripe Gateway...';
    }
  };

  const germanBanks = [
    'Stadtsparkasse München (BLZ 701 500 00)',
    'Volksbank Raiffeisenbank Bayern Mitte',
    'Deutsche Bank Privat- & Geschäftskunden',
    'Commerzbank AG',
    'Postbank (Niederlassung der DB)',
    'ING-DiBa AG (Direktbank)',
    'DKB Deutsche Kreditbank',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0" onClick={() => !isProcessing && onClose()} />

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {completedOrder
                  ? language === 'de'
                    ? 'Bestellung bestätigt'
                    : 'Order Confirmed'
                  : language === 'de'
                  ? 'Sichere Kasse & Zahlungsarten'
                  : 'Secure Checkout & Payment Methods'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {completedOrder
                  ? language === 'de'
                    ? 'Ihr Paket wird für den Versand vorbereitet'
                    : 'Your package is queued for shipping'
                  : language === 'de'
                  ? 'Gängige Zahlungsarten in Deutschland mit 256-Bit SSL Schutz'
                  : 'Encrypted German & EU payment options'}
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Completed Screen */}
        {completedOrder ? (
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 dark:ring-emerald-900/30">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 mb-2">
                {language === 'de' ? 'Zahlung autorisiert & bezahlt' : 'Payment Authorized & Paid'}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {language === 'de' ? `Vielen Dank, ${completedOrder.customer_name}!` : `Thank You, ${completedOrder.customer_name}!`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'de' ? 'Eine Bestätigung wurde versendet an ' : 'A confirmation receipt has been dispatched to '}
                <strong className="text-slate-700 dark:text-slate-200">{completedOrder.customer_email}</strong>
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">{language === 'de' ? 'Bestellnummer' : 'Order Number'}</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {completedOrder.order_number}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400">{language === 'de' ? 'Gesamtbetrag' : 'Total Charged'}</span>
                  <p className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                    {formatPrice(completedOrder.total)}
                  </p>
                </div>
              </div>

              {/* Payment Method Used */}
              <div className="pb-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">{language === 'de' ? 'Gewählte Zahlungsart' : 'Payment Method'}</span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {completedOrder.payment_details?.method_name || completedOrder.payment_method.toUpperCase()}
                  </p>
                  {completedOrder.payment_details?.iban_last4 && (
                    <span className="text-[11px] font-mono text-slate-500">
                      IBAN: •••• {completedOrder.payment_details.iban_last4} ({completedOrder.payment_details.bank_name || 'Bank'})
                    </span>
                  )}
                  {completedOrder.payment_details?.paypal_email && (
                    <span className="text-[11px] text-slate-500">
                      PayPal: {completedOrder.payment_details.paypal_email}
                    </span>
                  )}
                  {completedOrder.payment_details?.mandate_ref && (
                    <span className="block text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      SEPA Mandatsreferenz: {completedOrder.payment_details.mandate_ref}
                    </span>
                  )}
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {language === 'de' ? 'Freigegeben' : 'Approved'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">{language === 'de' ? 'Versand & Sendungs-ID' : 'Carrier & Tracking'}</span>
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {completedOrder.tracking_number} ({completedOrder.carrier})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400">{language === 'de' ? 'Voraussichtliche Ankunft' : 'Estimated Delivery'}</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {completedOrder.estimated_delivery}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">{language === 'de' ? 'Lieferadresse:' : 'Delivering To:'}</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {completedOrder.shipping_address.street}, {completedOrder.shipping_address.city},{' '}
                  {completedOrder.shipping_address.state} {completedOrder.shipping_address.zip}, {completedOrder.shipping_address.country}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOrderSuccess(completedOrder);
                }}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>{language === 'de' ? 'Paket live verfolgen' : 'Track Package Real-Time'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {onViewInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewInvoice(completedOrder);
                  }}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{language === 'de' ? 'Rechnung (§ 14 UStG)' : 'Tax Invoice'}</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('cart.continue')}
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmitPayment} className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Section 1: Customer & Delivery Address */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  {t('checkout.step1')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {t('auth.fullName')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {language === 'de' ? 'Straße & Hausnummer' : 'Street Address'}
                  </label>
                  <input
                    type="text"
                    name="street"
                    required
                    value={formData.street}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {t('auth.city')}
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      {language === 'de' ? 'Bundesland / Region' : 'State'}
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleFormChange}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      {language === 'de' ? 'Postleitzahl (PLZ)' : 'Zip Code'}
                    </label>
                    <input
                      type="text"
                      name="zip"
                      required
                      value={formData.zip}
                      onChange={handleFormChange}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: German Shipping Carriers (DHL / Hermes) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>{language === 'de' ? 'Versanddienstleister & Zustellart' : 'Shipping Carrier & Delivery Method'}</span>
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  {language === 'de' ? 'Klimaneutraler Versand' : 'Eco-Friendly Delivery'}
                </span>
              </div>

              {/* Carrier Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3 text-xs">
                {/* DHL Paket */}
                <button
                  type="button"
                  onClick={() => {
                    setShippingCarrier('DHL');
                    if (deliveryType === 'paketshop') setDeliveryType('home');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    shippingCarrier === 'DHL'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-400/40'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-amber-700 dark:text-amber-400">DHL Paket</span>
                    <span className="text-[10px] font-bold text-slate-500">1-2 Tage</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {language === 'de' ? 'GoGreen klimaneutral, Packstation-fähig' : 'GoGreen carbon-neutral, Packstation ready'}
                  </p>
                  <span className="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {shippingCost === 0 ? (language === 'de' ? 'Kostenlos' : 'Free') : formatPrice(shippingCost)}
                  </span>
                </button>

                {/* Hermes Paket */}
                <button
                  type="button"
                  onClick={() => {
                    setShippingCarrier('Hermes');
                    if (deliveryType === 'packstation') setDeliveryType('home');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    shippingCarrier === 'Hermes'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-400/40'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">Hermes</span>
                    <span className="text-[10px] font-bold text-slate-500">2-3 Tage</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {language === 'de' ? 'Zustellung an Haustür oder Hermes PaketShop' : 'Home delivery or Hermes PaketShop'}
                  </p>
                  <span className="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {shippingCost === 0 ? (language === 'de' ? 'Kostenlos' : 'Free') : formatPrice(shippingCost)}
                  </span>
                </button>

                {/* DHL Express */}
                <button
                  type="button"
                  onClick={() => {
                    setShippingCarrier('DHL_EXPRESS');
                    if (deliveryType === 'paketshop') setDeliveryType('home');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    shippingCarrier === 'DHL_EXPRESS'
                      ? 'border-amber-600 bg-amber-100/60 dark:bg-amber-950/60 ring-2 ring-amber-500/50'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-amber-700 dark:text-amber-300">DHL Express</span>
                    <span className="text-[10px] font-bold text-amber-600">Morgen 12h</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {language === 'de' ? 'Garantierte Zustellung nächster Werktag' : 'Guaranteed next business day delivery'}
                  </p>
                  <span className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    +4,90 €
                  </span>
                </button>
              </div>

              {/* Delivery Destination Type: Address vs Packstation / PaketShop */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('home')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      deliveryType === 'home'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {language === 'de' ? 'Standard Hauszustellung' : 'Home Delivery'}
                  </button>

                  {shippingCarrier.startsWith('DHL') && (
                    <button
                      type="button"
                      onClick={() => setDeliveryType('packstation')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        deliveryType === 'packstation'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {language === 'de' ? 'DHL Packstation / Postfiliale' : 'DHL Packstation Lockers'}
                    </button>
                  )}

                  {shippingCarrier === 'Hermes' && (
                    <button
                      type="button"
                      onClick={() => setDeliveryType('paketshop')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        deliveryType === 'paketshop'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {language === 'de' ? 'Hermes PaketShop Direktabholung' : 'Hermes PaketShop Pickup'}
                    </button>
                  )}
                </div>

                {deliveryType === 'packstation' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                        {language === 'de' ? 'Packstation Nummer (3-stellig)' : 'Packstation Number'}
                      </label>
                      <input
                        type="text"
                        placeholder="z.B. 142"
                        value={packstationNumber}
                        onChange={(e) => setPackstationNumber(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                        {language === 'de' ? 'PostNummer (Ihre Kunden-ID)' : 'PostNumber ID'}
                      </label>
                      <input
                        type="text"
                        placeholder="z.B. 91827364"
                        value={postNumber}
                        onChange={(e) => setPostNumber(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {deliveryType === 'paketshop' && (
                  <div className="pt-1">
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                      {language === 'de' ? 'Hermes PaketShop Name / ID in Ihrer Nähe' : 'Hermes PaketShop Name / ID'}
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. Kiosk am Karlsplatz (Shop-80539)"
                      value={hermesShopId}
                      onChange={(e) => setHermesShopId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: German & EU Payment Methods Selection */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    3
                  </span>
                  {t('checkout.step2')}
                </h3>

                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {language === 'de' ? 'Demo-Modus aktiv' : 'Sandbox Active'}
                </span>
              </div>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {/* SEPA-Lastschrift */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('sepa')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === 'sepa'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {selectedMethod === 'sepa' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      SEPA-Lastschrift
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'de' ? 'Bankeinzug (DE/EU)' : 'Direct Debit'}
                    </span>
                  </div>
                </button>

                {/* PayPal */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('paypal')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === 'paypal'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-extrabold font-serif text-sm text-[#0079C1] dark:text-[#00457C]">
                      P<span className="text-[#00457C] dark:text-[#0079C1]">P</span>
                    </span>
                    {selectedMethod === 'paypal' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      PayPal
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'de' ? 'Käuferschutz & Später' : 'Express Checkout'}
                    </span>
                  </div>
                </button>

                {/* Klarna */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('klarna')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === 'klarna'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#FFB3C7] text-black">
                      Klarna.
                    </span>
                    {selectedMethod === 'klarna' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Klarna
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'de' ? 'Rechnung (30 Tage) / Sofort' : 'Pay Later / Sofort'}
                    </span>
                  </div>
                </button>

                {/* Kreditkarte (Stripe) */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('stripe')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === 'stripe'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <CreditCard className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    {selectedMethod === 'stripe' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {language === 'de' ? 'Kreditkarte' : 'Credit Card'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Visa, Mastercard, Amex
                    </span>
                  </div>
                </button>

                {/* Giropay / Wero */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('giropay')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === 'giropay'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {selectedMethod === 'giropay' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Giropay / Wero
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'de' ? 'Online-Banking DE' : 'Bank Transfer'}
                    </span>
                  </div>
                </button>

                {/* Apple / Google Pay */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('apple_pay')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === 'apple_pay'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Smartphone className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    {selectedMethod === 'apple_pay' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Apple / Google Pay
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'de' ? '1-Klick Wallet' : 'Digital Wallet'}
                    </span>
                  </div>
                </button>

                {/* Vorkasse / Bank Transfer */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('bank_transfer')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {selectedMethod === 'bank_transfer' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {language === 'de' ? 'Vorkasse / Überweisung' : 'Bank Transfer'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'de' ? 'Klassische IBAN-Zahlung' : 'Manual wire transfer'}
                    </span>
                  </div>
                </button>

                {/* Nachnahme / Cash on Delivery DHL */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('cash_on_delivery')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === 'cash_on_delivery'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    {selectedMethod === 'cash_on_delivery' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {language === 'de' ? 'Nachnahme (DHL)' : 'Cash on Delivery'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'de' ? '+3,90 € bei Zustellung' : 'Pay courier directly'}
                    </span>
                  </div>
                </button>

                {/* Wero - European Payments Initiative */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('wero')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === 'wero'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {selectedMethod === 'wero' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Wero (EPI)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'de' ? 'Echtzeit per Bank-App' : 'Instant European Pay'}
                    </span>
                  </div>
                </button>
              </div>

              {/* METHOD 1: SEPA-Lastschrift Fields */}
              {selectedMethod === 'sepa' && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'de' ? 'SEPA-Basislastschrift (Bankeinzug)' : 'SEPA Direct Debit'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillTestSepa}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                    >
                      ⚡ {language === 'de' ? 'Demo-IBAN einfügen' : 'Fill Test IBAN'}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                      {language === 'de' ? 'Kontoinhaber' : 'Account Holder Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={sepaData.accountHolder}
                      onChange={(e) => setSepaData({ ...sepaData, accountHolder: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                        IBAN (International Bank Account Number)
                      </label>
                      <input
                        type="text"
                        required
                        value={sepaData.iban}
                        onChange={(e) => setSepaData({ ...sepaData, iban: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        placeholder="DE89 3704 0044 0532 0130 00"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                        BIC (Bank Identifier)
                      </label>
                      <input
                        type="text"
                        value={sepaData.bic}
                        onChange={(e) => setSepaData({ ...sepaData, bic: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        placeholder="BYLADEM1001"
                      />
                    </div>
                  </div>

                  {/* Statutory German SEPA Mandate Notice */}
                  <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between font-mono text-[9px] text-blue-700 dark:text-blue-300">
                      <span>Gläubiger-ID: DE98ZZZ09999999999</span>
                      <span>Mandatsreferenz: Automatisch bei Buchung</span>
                    </div>
                    <p className="leading-relaxed">
                      {language === 'de'
                        ? 'Ich ermächtige die BlueCart Retail Store GmbH, Zahlungen von meinem Konto mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die gezogenen Lastschriften einzulösen. Hinweis: Sie können innerhalb von 8 Wochen, beginnend mit dem Belastungsdatum, die Erstattung verlangen.'
                        : 'I authorize BlueCart Retail Store GmbH to collect payments from my account by direct debit. Within 8 weeks from the debit date, you can request a refund under the conditions of your agreement with your bank.'}
                    </p>
                  </div>
                </div>
              )}

              {/* METHOD 2: PayPal Fields */}
              {selectedMethod === 'paypal' && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold font-serif text-sm text-[#0079C1]">PayPal</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'de' ? 'Express Checkout & Käuferschutz' : 'Express Checkout'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillTestPaypal}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                    >
                      ⚡ {language === 'de' ? 'Demo-PayPal einfügen' : 'Fill Test PayPal'}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                      {language === 'de' ? 'PayPal E-Mail-Adresse' : 'PayPal Email Address'}
                    </label>
                    <input
                      type="email"
                      required
                      value={paypalData.email}
                      onChange={(e) => setPaypalData({ ...paypalData, email: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* German PayPal "Später Bezahlen" Option */}
                  <label className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paypalData.payLater30Days}
                      onChange={(e) => setPaypalData({ ...paypalData, payLater30Days: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {language === 'de' ? 'PayPal: Später bezahlen (in 30 Tagen)' : 'PayPal: Pay in 30 Days'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {language === 'de'
                          ? 'Erst nach Warenerhalt bezahlen. Vorbehaltlich Bonitätsprüfung durch PayPal.'
                          : 'Pay 30 days after dispatch. Subject to status and credit check.'}
                      </span>
                    </div>
                  </label>

                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0079C1] shrink-0" />
                    <span>
                      {language === 'de'
                        ? '100% PayPal Käuferschutz: Sie sind bei Nichtlieferung oder Abweichungen vollständig abgesichert.'
                        : 'Full PayPal Buyer Protection included for this transaction.'}
                    </span>
                  </div>
                </div>
              )}

              {/* METHOD 3: Klarna Fields */}
              {selectedMethod === 'klarna' && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#FFB3C7] text-black">
                        Klarna.
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'de' ? 'Zahlungsoption wählen' : 'Select Klarna Option'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillTestKlarna}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                    >
                      ⚡ {language === 'de' ? 'Demo-Daten einfügen' : 'Fill Test Klarna'}
                    </button>
                  </div>

                  {/* Klarna Sub-Options */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setKlarnaData({ ...klarnaData, type: 'invoice' })}
                      className={`p-2 rounded-xl text-left border text-xs cursor-pointer transition-all ${
                        klarnaData.type === 'invoice'
                          ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 font-bold text-slate-900 dark:text-white ring-1 ring-pink-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="block font-bold text-[11px]">
                        {language === 'de' ? 'Rechnung' : 'Pay in 30d'}
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        {language === 'de' ? 'In 30 Tagen' : '0% interest'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKlarnaData({ ...klarnaData, type: 'sofort' })}
                      className={`p-2 rounded-xl text-left border text-xs cursor-pointer transition-all ${
                        klarnaData.type === 'sofort'
                          ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 font-bold text-slate-900 dark:text-white ring-1 ring-pink-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="block font-bold text-[11px]">
                        {language === 'de' ? 'Sofortüberweisung' : 'Sofort'}
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        {language === 'de' ? 'Direkt mit PIN' : 'Direct transfer'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKlarnaData({ ...klarnaData, type: 'slice_it' })}
                      className={`p-2 rounded-xl text-left border text-xs cursor-pointer transition-all ${
                        klarnaData.type === 'slice_it'
                          ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 font-bold text-slate-900 dark:text-white ring-1 ring-pink-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="block font-bold text-[11px]">
                        {language === 'de' ? 'Ratenkauf' : 'Slice It'}
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        {language === 'de' ? 'Ab 3 Monate' : 'Installments'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                        {language === 'de' ? 'Geburtsdatum (für Bonitätsprüfung)' : 'Date of Birth (Identity)'}
                      </label>
                      <input
                        type="text"
                        required
                        value={klarnaData.birthDate}
                        onChange={(e) => setKlarnaData({ ...klarnaData, birthDate: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-pink-500"
                        placeholder="DD.MM.YYYY"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                        {language === 'de' ? 'Mobilnummer für SMS-PIN' : 'Mobile for SMS OTP'}
                      </label>
                      <input
                        type="text"
                        required
                        value={klarnaData.phone}
                        onChange={(e) => setKlarnaData({ ...klarnaData, phone: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-pink-50/50 dark:bg-pink-950/20 rounded-xl border border-pink-200 dark:border-pink-900 text-[10px] text-slate-600 dark:text-slate-300">
                    <p>
                      {klarnaData.type === 'invoice'
                        ? (language === 'de'
                            ? 'Klarna Rechnung: Sie erhalten die Ware zuerst und überweisen den Betrag bequem innerhalb von 30 Tagen ab Versanddatum.'
                            : 'Klarna Pay Later: Inspect items first, settle the balance within 30 days after dispatch.')
                        : klarnaData.type === 'sofort'
                        ? (language === 'de'
                            ? 'Sofortüberweisung: Direktabbuchung von Ihrem Girokonto ohne Registrierung bei Klarna.'
                            : 'Sofort: Direct, instant automated wire transfer from your online banking account.')
                        : (language === 'de'
                            ? 'Klarna Ratenkauf: Monatliche Raten ab 6,95 € / Monat bei flexibler Laufzeit.'
                            : 'Klarna Slice It: Split your payment into flexible monthly installments.')}
                    </p>
                  </div>
                </div>
              )}

              {/* METHOD 4: Stripe Credit / Debit Card Fields */}
              {selectedMethod === 'stripe' && (
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-sm border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">CREDIT / DEBIT CARD</span>
                    <button
                      type="button"
                      onClick={handleFillTestCard}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer transition-colors"
                    >
                      ⚡ {language === 'de' ? 'Stripe Testkarte (4242)' : 'Fill Test Card (4242)'}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {language === 'de' ? 'Kartennummer' : 'Card Number'}
                    </label>
                    <input
                      type="text"
                      value={cardData.cardNumber}
                      onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white tracking-widest outline-none focus:border-blue-500"
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        {language === 'de' ? 'Gültig bis' : 'Expires'}
                      </label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        {language === 'de' ? 'Prüfnummer (CVC)' : 'CVC Security'}
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardData.cvc}
                        onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                        placeholder="•••"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 5: Giropay / Wero Fields */}
              {selectedMethod === 'giropay' && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'de' ? 'Giropay / Wero Online-Banking' : 'Giropay Bank Transfer'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Deutsche Kreditwirtschaft
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                      {language === 'de' ? 'Ihre Bank oder Sparkasse auswählen' : 'Select your German Bank'}
                    </label>
                    <select
                      value={giropayData.bankName}
                      onChange={(e) => setGiropayData({ bankName: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      {germanBanks.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFillTestGiropay('Stadtsparkasse München (BLZ 701 500 00)')}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      ⚡ Sparkasse
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillTestGiropay('Volksbank Raiffeisenbank Bayern Mitte')}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      ⚡ Volksbank
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillTestGiropay('Deutsche Bank Privat- & Geschäftskunden')}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      ⚡ Deutsche Bank
                    </button>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 text-[10px] text-slate-600 dark:text-slate-300">
                    {language === 'de'
                      ? 'Direkte Freigabe über das gewohnte Online-Banking Ihrer Sparkasse / Bank per chipTAN, pushTAN oder photoTAN.'
                      : 'Authorizes immediately via your German banking portal with 2-factor authentication.'}
                  </div>
                </div>
              )}

              {/* METHOD 6: Apple Pay / Google Pay */}
              {selectedMethod === 'apple_pay' && (
                <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold">Apple Pay & Google Wallet Express</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black">
                      Touch ID / Face ID
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'de'
                      ? 'Mit einem Klick auf den Bestellbutton wird Ihre digitale Wallet mit hinterlegter Girocard / Kreditkarte aufgerufen und sicher biometrisch freigegeben.'
                      : 'Express one-tap checkout using your device secure element and stored biometric credentials.'}
                  </p>

                  <div className="p-2.5 bg-slate-800 rounded-xl text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Device Account Number Tokenization (DAN) active</span>
                  </div>
                </div>
              )}

              {/* METHOD 7: Bank Transfer (Vorkasse / Überweisung) */}
              {selectedMethod === 'bank_transfer' && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'de' ? 'Vorkasse / Banküberweisung' : 'Bank Transfer (Pre-payment)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillTestBankTransfer}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer transition-colors"
                    >
                      ⚡ {language === 'de' ? 'Demo-Daten' : 'Test Data'}
                    </button>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {language === 'de'
                        ? 'Bitte überweisen Sie den Betrag nach Bestelleingang an folgendes deutsches Geschäftskonto:'
                        : 'Please wire the full balance to our official corporate account upon order confirmation:'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px]">EMPFÄNGER:</span>
                        <span className="font-bold text-slate-900 dark:text-white">BlueCart Germany GmbH</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">BANK:</span>
                        <span className="font-bold text-slate-900 dark:text-white">Deutsche Bank AG Frankfurt</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">IBAN:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">DE21 5007 0010 0123 4567 89</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">BIC / SWIFT:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">DEUTDEDDFXX</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {language === 'de' ? 'Verwendungszweck:' : 'Payment Reference:'}
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        BC-VORKASSE-{(formData.zip || 'DE').slice(0, 4)}-DEMO
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900 text-[10px] text-slate-600 dark:text-slate-300">
                    <p>
                      {language === 'de'
                        ? 'Ihr Paket wird unmittelbar nach Zahlungseingang (i. d. R. 1 Bankarbeitstag via SEPA) verpackt und an DHL übergeben.'
                        : 'Your package will be dispatched immediately upon receipt of funds (typically 1 business day via SEPA).'}
                    </p>
                  </div>
                </div>
              )}

              {/* METHOD 8: Cash on Delivery (Nachnahme DHL) */}
              {selectedMethod === 'cash_on_delivery' && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'de' ? 'Nachnahme (Barzahlung bei Paketübergabe)' : 'Cash on Delivery (DHL / Courier)'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      +3,90 € Gebühr
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                        {language === 'de' ? 'Gewünschter Zustellservice' : 'Preferred Courier Service'}
                      </label>
                      <select
                        value={codData.courierPreferred}
                        onChange={(e) => setCodData({ ...codData, courierPreferred: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      >
                        <option value="DHL Express Postbote">DHL Express Postbote (Bar oder girocard an der Haustür)</option>
                        <option value="Hermes Zustellservice">Hermes Kurierdienst (Barzahlung an der Haustür)</option>
                        <option value="DHL Packstation / Filiale">DHL Filiale / Postagentur (Abholung mit EC-Karte)</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={codData.exactCashAvailable}
                        onChange={(e) => setCodData({ ...codData, exactCashAvailable: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px]">
                        {language === 'de'
                          ? `Ich halte den Gesamtbetrag (${formatPrice(payableTotal)}) bei Übergabe in bar oder per Girocard bereit.`
                          : `I will have the exact total amount (${formatPrice(payableTotal)}) ready for courier handover.`}
                      </span>
                    </label>
                  </div>

                  <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 text-[10px] text-slate-600 dark:text-slate-300">
                    <p>
                      {language === 'de'
                        ? 'Sicher & risikolos: Sie bezahlen erst, wenn der DHL-Bote Ihnen das versiegelte Paket persönlich übergibt. Es fällt ein Nachnahmeentgelt von 3,90 € an.'
                        : 'Maximum confidence: You only pay when the parcel is physically in your hands. Standard German courier cash-handling surcharge of €3.90 applies.'}
                    </p>
                  </div>
                </div>
              )}

              {/* METHOD 9: Wero (EPI European Payments Initiative) */}
              {selectedMethod === 'wero' && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Wero • European Payments Initiative (EPI)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillTestWero}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors"
                    >
                      ⚡ {language === 'de' ? 'Demo Wero-ID' : 'Test Wero ID'}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWeroData({ ...weroData, identifierType: 'phone' })}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        weroData.identifierType === 'phone'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {language === 'de' ? 'Handynummer' : 'Phone Number'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeroData({ ...weroData, identifierType: 'email' })}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        weroData.identifierType === 'email'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {language === 'de' ? 'E-Mail-Adresse' : 'E-Mail ID'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeroData({ ...weroData, identifierType: 'qr' })}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        weroData.identifierType === 'qr'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {language === 'de' ? 'QR-Code' : 'QR Scan'}
                    </button>
                  </div>

                  {weroData.identifierType !== 'qr' ? (
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">
                        {weroData.identifierType === 'phone'
                          ? (language === 'de' ? 'In der Banking-App registrierte Mobilfunknummer' : 'Mobile Phone linked to Bank App')
                          : (language === 'de' ? 'In der Banking-App hinterlegte E-Mail-Adresse' : 'Registered Bank App Email')}
                      </label>
                      <input
                        type={weroData.identifierType === 'phone' ? 'tel' : 'email'}
                        required
                        value={weroData.identifierValue}
                        onChange={(e) => setWeroData({ ...weroData, identifierValue: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                        placeholder={weroData.identifierType === 'phone' ? '+49 171 1234567' : 'kunde@sparkasse.de'}
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                        <QrCode className="w-10 h-10 text-emerald-600" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 dark:text-white">Wero Instant QR</p>
                        <p className="text-[11px] text-slate-500">
                          {language === 'de'
                            ? 'Öffnen Sie Ihre Sparkassen- oder Bank-App und scannen Sie diesen Code zur sofortigen Echtzeit-Überweisung.'
                            : 'Scan with your German banking app (Sparkasse, VR Bank, Deutsche Bank) for instant account settlement.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                      {language === 'de' ? 'Teilnehmende Wero-Partnerbank' : 'Participating Wero Partner Bank'}
                    </label>
                    <select
                      value={weroData.participatingBank}
                      onChange={(e) => setWeroData({ ...weroData, participatingBank: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Sparkasse (EPI Member)">Sparkassen-Finanzgruppe (Stadtsparkasse, Kreissparkasse)</option>
                      <option value="Volksbanken Raiffeisenbanken (EPI Member)">Volksbanken Raiffeisenbanken (VR-Bank)</option>
                      <option value="Deutsche Bank AG (EPI Member)">Deutsche Bank AG & Postbank</option>
                      <option value="Sparda-Bank & PSD Banken">Sparda-Bank / PSD Bankengruppe</option>
                    </select>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 text-[10px] text-slate-600 dark:text-slate-300">
                    <p>
                      {language === 'de'
                        ? 'Wero ist der neue europäische Zahlungsstandard der Sparkassen und Banken. Das Geld wird in unter 10 Sekunden direkt von Girokonto zu Girokonto transferiert – ohne Kreditkarten-Umwege.'
                        : 'Wero is the new sovereign European payment wallet directly connecting German bank accounts with sub-10s settlement.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Essential Features & Order Summary (§ 312j Abs. 2 BGB) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  4
                </span>
                <span>{t('checkout.summaryTitle')}</span>
              </h3>

              {/* Items List (Wesentliche Merkmale der Ware) */}
              <div className="max-h-36 overflow-y-auto space-y-2 mb-3 pr-1">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-9 h-9 object-cover rounded-lg shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {language === 'de' && item.product.title_de ? item.product.title_de : item.product.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.quantity} × {formatPrice(item.product.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>{t('cart.discount')}</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t('cart.shipping')}</span>
                  <span>{shippingCost === 0 ? t('cart.freeShipping') : formatPrice(shippingCost)}</span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{language === 'de' ? 'Versandart' : 'Shipping Method'}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {shippingCarrier === 'Hermes' ? 'Hermes Paket' : (shippingCarrier === 'DHL_EXPRESS' ? 'DHL Express' : 'DHL Paket (GoGreen)')}
                  </span>
                </div>

                {/* Express surcharge */}
                {shippingCarrier === 'DHL_EXPRESS' && (
                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
                    <span>{language === 'de' ? 'DHL Express Aufpreis' : 'DHL Express Surcharge'}</span>
                    <span>+{formatPrice(4.90)}</span>
                  </div>
                )}

                {/* Cash on Delivery Fee Line */}
                {selectedMethod === 'cash_on_delivery' && (
                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
                    <span>{language === 'de' ? 'DHL-Nachnahmeentgelt' : 'Cash on Delivery Fee'}</span>
                    <span>+{formatPrice(codData.codServiceFee)}</span>
                  </div>
                )}

                {/* Statutory VAT extraction notice */}
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>{t('cart.tax')}</span>
                  <span>{formatPrice(tax)}</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>{t('cart.total')}</span>
                  <span className="text-blue-600 dark:text-blue-400">{formatPrice(payableTotal)}</span>
                </div>
              </div>
            </div>

            {/* German Law: Mandatory Opt-In Consent Checkbox */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 text-xs space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {language === 'de' ? (
                    <>
                      Ich habe die{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalTab?.('terms')}
                        className="text-blue-600 dark:text-blue-400 underline font-semibold cursor-pointer"
                      >
                        Allgemeinen Geschäftsbedingungen (AGB)
                      </button>{' '}
                      und die{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalTab?.('revocation')}
                        className="text-blue-600 dark:text-blue-400 underline font-semibold cursor-pointer"
                      >
                        Widerrufsbelehrung
                      </button>{' '}
                      zur Kenntnis genommen und erkläre mich mit deren Geltung einverstanden. Die{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalTab?.('privacy')}
                        className="text-blue-600 dark:text-blue-400 underline font-semibold cursor-pointer"
                      >
                        Datenschutzerklärung
                      </button>{' '}
                      habe ich zur Kenntnis genommen.
                    </>
                  ) : (
                    <>
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalTab?.('terms')}
                        className="text-blue-600 dark:text-blue-400 underline font-semibold cursor-pointer"
                      >
                        Terms & Conditions
                      </button>{' '}
                      and the{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalTab?.('revocation')}
                        className="text-blue-600 dark:text-blue-400 underline font-semibold cursor-pointer"
                      >
                        Right of Withdrawal
                      </button>
                      . I have taken note of the{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalTab?.('privacy')}
                        className="text-blue-600 dark:text-blue-400 underline font-semibold cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                      .
                    </>
                  )}
                </span>
              </label>

              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {t('checkout.vatNotice')}
              </p>
            </div>

            {/* Submit Button (Button-Lösung § 312j Abs. 3 BGB) */}
            <button
              type="submit"
              disabled={isProcessing || !termsAccepted}
              className={`w-full py-4 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !termsAccepted
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                  : isProcessing
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{getProcessingText()}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{t('checkout.placeOrder')} • {formatPrice(payableTotal)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === 'de'
                  ? 'Geschützt durch 256-Bit SSL Verschlüsselung & deutsches E-Commerce Recht'
                  : 'Secured with 256-bit SSL encryption & German compliance'}
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

