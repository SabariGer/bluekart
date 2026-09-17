import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  formatPrice: (amount?: number | null) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Top Bar & Navbar
    'nav.announcement': '⚡ FLASH SALE: Up to 50% off select essentials + Free express shipping over $50!',
    'nav.searchPlaceholder': 'Search products, brands, or German specialties...',
    'nav.categories': 'All Categories',
    'nav.deals': 'Flash Deals',
    'nav.slideshow': 'Featured Highlights',
    'nav.trackOrder': 'Track Order',
    'nav.cart': 'Cart',
    'nav.signIn': 'Sign In',
    'nav.register': 'Create Account',
    'nav.adminPortal': 'Admin Portal',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.signOut': 'Sign Out',
    'nav.themeDark': 'Dark Mode',
    'nav.themeLight': 'Light Mode',
    'nav.customerMode': 'Customer Account',
    'nav.adminMode': 'Store Administrator',
    'nav.welcome': 'Welcome back',
    'nav.quickAccess': 'Quick Test Login',
    'nav.allProducts': 'All Products',

    // Announcement Bar
    'announcement.freeShipping': 'Free express delivery on orders over $50',
    'announcement.promoCode': 'Use code BLUE20 for 20% off',
    'announcement.stripeSecurity': 'Stripe 256-Bit Encrypted Payments',
    'announcement.trackOrders': 'Track orders live with real-time carrier updates',

    // Hero & Slideshow
    'slideshow.title': 'Featured Collections & German Craftsmanship',
    'slideshow.shopNow': 'Shop Now',
    'slideshow.viewDeal': 'View Deal',
    'slideshow.freeShipping': 'Free Express Delivery Available',
    'slideshow.limitedOffer': 'Limited Time Offer',
    'slideshow.stripeSecurity': 'Stripe Verified Payment Guarantee',

    // Flash Sale
    'flash.title': 'Flash Sale • Blitzangebote',
    'flash.subtitle': 'Limited-time discounts refreshed every 24 hours. Grab them while stocks last!',
    'flash.endsIn': 'Deals End In:',
    'flash.hours': 'h',
    'flash.minutes': 'm',
    'flash.seconds': 's',
    'flash.claimed': 'sold',
    'flash.leftInStock': 'left in stock',
    'flash.addToCart': 'Add to Cart',
    'flash.save': 'Save',

    // Category section
    'categories.title': 'Curated Departments',
    'categories.all': 'All Products',
    'categories.germanOrigin': 'Made in Germany',
    'categories.filterBy': 'Filter by Department',
    'category.shopBy': 'Shop by Department',
    'category.all': 'All Products',
    'category.clearFilter': 'Clear filter',
    'category.sort': 'Sort by',
    'category.sortFeatured': 'Featured',
    'category.sortPriceLow': 'Price: Low to High',
    'category.sortPriceHigh': 'Price: High to Low',
    'category.sortRating': 'Highest Rated',

    // Product Card & Listing
    'product.addToCart': 'Add to Cart',
    'product.added': 'Added to Cart',
    'product.quickView': 'Quick View',
    'product.inStock': 'In Stock',
    'product.lowStock': 'Only {count} left',
    'product.onlyLeft': 'Only left:',
    'product.outOfStock': 'Out of Stock',
    'product.reviews': 'reviews',
    'product.bestseller': 'Best Seller',
    'product.sale': 'Sale',
    'product.new': 'New',
    'product.featured': 'Featured',
    'product.sort': 'Sort by',
    'product.sortFeatured': 'Featured',
    'product.sortPriceAsc': 'Price: Low to High',
    'product.sortPriceDesc': 'Price: High to Low',
    'product.sortRating': 'Highest Rated',

    'product.vatNotice': 'incl. 19% VAT, excl. shipping',
    'product.vatNoticeFree': 'incl. 19% VAT, free shipping',
    'product.deliveryTime': 'Delivery time: 1–3 business days (DHL Express)',
    'product.lowestPrice30d': 'Lowest price of the past 30 days',
    'product.shippingModalLink': 'Shipping details',

    // Cart Drawer
    'cart.title': 'Your Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptySub': 'Discover our collection and add your favorite items.',
    'cart.subtotal': 'Subtotal (gross)',
    'cart.discount': 'Discount',
    'cart.tax': 'Included 19% VAT',
    'cart.shipping': 'Shipping (DHL Express)',
    'cart.freeShipping': 'FREE (from 50 €)',
    'cart.total': 'Total amount (incl. 19% VAT)',
    'cart.checkout': 'Proceed to Checkout',
    'cart.checkoutBtn': 'Proceed to Checkout',
    'cart.continue': 'Continue Shopping',
    'cart.promo': 'Promo code applied: BLUE20',

    // Checkout
    'checkout.title': 'Secure Checkout',
    'checkout.stripe': 'Powered by Stripe 256-bit SSL',
    'checkout.step1': 'Shipping Address',
    'checkout.step2': 'Payment Method',
    'checkout.placeOrder': 'Order with obligation to pay',
    'checkout.orderSuccess': 'Order Placed Successfully!',
    'checkout.summaryTitle': 'Order Summary & Essential Features (§ 312j BGB)',
    'checkout.legalNotice': 'I have read the Terms & Conditions (AGB) and the Cancellation Policy (Widerrufsbelehrung) and agree to their application. I have taken note of the Privacy Policy.',
    'checkout.vatNotice': 'All prices are gross and include 19% statutory German VAT.',
    'checkout.methodCard': 'Credit / Debit Card',
    'checkout.methodPaypal': 'PayPal',
    'checkout.methodKlarna': 'Klarna',
    'checkout.methodSepa': 'SEPA Direct Debit',
    'checkout.methodGiropay': 'Giropay / Wero',
    'checkout.methodApplePay': 'Apple Pay / Google Pay',
    'checkout.dummyNotice': 'Demo sandbox active • Simulated approval without live charge',

    // Tracking
    'tracking.title': 'Live Package Tracker',
    'tracking.placeholder': 'Enter Order ID (e.g. BC-2026-8910)',
    'tracking.trackBtn': 'Track Package',

    // Auth Pages
    'auth.customerLoginTitle': 'Customer Sign In',
    'auth.customerLoginSub': 'Sign in to access your orders, saved addresses, and express checkout.',
    'auth.customerRegisterTitle': 'Create Customer Account',
    'auth.customerRegisterSub': 'Join BlueCart for exclusive member discounts and live delivery alerts.',
    'auth.adminLoginTitle': 'Store Administrator Portal',
    'auth.adminLoginSub': 'Restricted management console for catalog, stock inventory, and revenue analytics.',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.country': 'Country / Region',
    'auth.city': 'City',
    'auth.createAccountBtn': 'Create My Account',
    'auth.signInBtn': 'Sign In',
    'auth.adminSignInBtn': 'Authenticate as Admin',
    'auth.noAccount': "Don't have an account?",
    'auth.alreadyAccount': 'Already have an account?',
    'auth.isAdminPrompt': 'Store Management Login?',
    'auth.isCustomerPrompt': 'Return to Customer Store Login',
    'auth.demoNotice': 'One-Click Demo Access:',

    // Footer
    'footer.about': 'About BlueCart',
    'footer.aboutDesc': 'Premium retail destination blending modern lifestyle essentials with authentic German engineering and delicatessen.',
    'footer.service': 'Customer Service',
    'footer.contact': 'Contact & Support',
    'footer.faq': 'FAQ & Help Center',
    'footer.shippingInfo': 'Shipping & Delivery',
    'footer.returns': '30-Day Returns Policy',
    'footer.legal': 'Legal & Trust',
    'footer.impressum': 'Impressum (Company Info)',
    'footer.privacy': 'Privacy Policy (GDPR / DSGVO)',
    'footer.terms': 'Terms & Conditions (AGB)',
    'footer.revocation': 'Right of Withdrawal & Sample Form (§ 312d BGB)',
    'footer.battery': 'Battery & Electronic Waste Notice (BattG / ElektroG)',
    'footer.cookies': 'Cookie Settings (§ 25 TDDDG)',
    'footer.paymentMethods': 'Secure Payment Options',
    'footer.newsletter': 'Newsletter & 10% Voucher',
    'footer.newsletterSub': 'Subscribe for weekly flash drops and German specialty arrivals.',
    'footer.subscribe': 'Subscribe',
    'footer.rights': 'All rights reserved.',
  },
  de: {
    // Top Bar & Navbar
    'nav.announcement': '⚡ BLITZANGEBOT: Bis zu 50% Rabatt auf ausgewählte Artikel + Kostenloser Expressversand ab 50€!',
    'nav.searchPlaceholder': 'Artikel, Marken oder deutsche Spezialitäten suchen...',
    'nav.categories': 'Alle Kategorien',
    'nav.deals': 'Blitzangebote',
    'nav.slideshow': 'Empfehlungen',
    'nav.trackOrder': 'Sendungsverfolgung',
    'nav.cart': 'Warenkorb',
    'nav.signIn': 'Anmelden',
    'nav.register': 'Konto erstellen',
    'nav.adminPortal': 'Admin-Portal',
    'nav.adminDashboard': 'Admin-Dashboard',
    'nav.signOut': 'Abmelden',
    'nav.themeDark': 'Dunkelmodus',
    'nav.themeLight': 'Hellmodus',
    'nav.customerMode': 'Kundenkonto',
    'nav.adminMode': 'Geschäftsführung / Admin',
    'nav.welcome': 'Willkommen zurück',
    'nav.quickAccess': '1-Klick Demo-Zugang',
    'nav.allProducts': 'Alle Produkte',

    // Announcement Bar
    'announcement.freeShipping': 'Kostenlose Express-Lieferung ab 50 €',
    'announcement.promoCode': 'Gutscheincode BLUE20 für 20% Rabatt',
    'announcement.stripeSecurity': 'Stripe 256-Bit SSL Verschlüsselung',
    'announcement.trackOrders': 'Live-Sendungsverfolgung mit Echtzeit-Updates',

    // Hero & Slideshow
    'slideshow.title': 'Ausgewählte Kollektionen & Deutsche Handwerkskunst',
    'slideshow.shopNow': 'Jetzt einkaufen',
    'slideshow.viewDeal': 'Angebot ansehen',
    'slideshow.freeShipping': 'Kostenloser Expressversand verfügbar',
    'slideshow.limitedOffer': 'Zeitlich begrenztes Angebot',
    'slideshow.stripeSecurity': 'Geprüfte Stripe-Zahlungsgarantie',

    // Flash Sale
    'flash.title': 'Blitzangebote • Flash Sale',
    'flash.subtitle': 'Tagesangebote mit Tiefstpreisen alle 24 Stunden erneuert. Nur solange der Vorrat reicht!',
    'flash.endsIn': 'Angebote enden in:',
    'flash.hours': 'Std',
    'flash.minutes': 'Min',
    'flash.seconds': 'Sek',
    'flash.claimed': 'verkauft',
    'flash.leftInStock': 'Stück auf Lager',
    'flash.addToCart': 'In den Warenkorb',
    'flash.save': 'Sparen Sie',

    // Category section
    'categories.title': 'Unsere Abteilungen',
    'categories.all': 'Alle Produkte',
    'categories.germanOrigin': 'Made in Germany',
    'categories.filterBy': 'Nach Abteilung filtern',
    'category.shopBy': 'Nach Abteilung shoppen',
    'category.all': 'Alle Produkte',
    'category.clearFilter': 'Filter aufheben',
    'category.sort': 'Sortieren nach',
    'category.sortFeatured': 'Empfohlen',
    'category.sortPriceLow': 'Preis: Aufsteigend',
    'category.sortPriceHigh': 'Preis: Absteigend',
    'category.sortRating': 'Beste Bewertungen',

    // Product Card & Listing
    'product.addToCart': 'In den Warenkorb',
    'product.added': 'Hinzugefügt',
    'product.quickView': 'Schnellansicht',
    'product.inStock': 'Auf Lager',
    'product.lowStock': 'Nur noch {count} Stück',
    'product.onlyLeft': 'Nur noch:',
    'product.outOfStock': 'Ausverkauft',
    'product.reviews': 'Bewertungen',
    'product.bestseller': 'Bestseller',
    'product.sale': 'Angebot',
    'product.new': 'Neu',
    'product.featured': 'Empfehlung',
    'product.sort': 'Sortieren nach',
    'product.sortFeatured': 'Empfohlen',
    'product.sortPriceAsc': 'Preis: Aufsteigend',
    'product.sortPriceDesc': 'Preis: Absteigend',
    'product.sortRating': 'Beste Bewertungen',
    'product.vatNotice': 'inkl. 19% MwSt., zzgl. Versand',
    'product.vatNoticeFree': 'inkl. 19% MwSt., versandkostenfrei',
    'product.deliveryTime': 'Lieferzeit: 1–3 Werktage (DHL Express)',
    'product.lowestPrice30d': 'Niedrigster Gesamtpreis der letzten 30 Tage',
    'product.shippingModalLink': 'Versandinformationen',

    // Cart Drawer
    'cart.title': 'Ihr Warenkorb',
    'cart.empty': 'Ihr Warenkorb ist leer',
    'cart.emptySub': 'Entdecken Sie unsere Kollektionen und fügen Sie Lieblingsartikel hinzu.',
    'cart.subtotal': 'Zwischensumme (brutto)',
    'cart.discount': 'Rabatt',
    'cart.tax': 'Darin enthaltene 19% MwSt.',
    'cart.shipping': 'Versand (DHL Express)',
    'cart.freeShipping': 'KOSTENLOS (ab 50 €)',
    'cart.total': 'Gesamtbetrag (inkl. 19% MwSt.)',
    'cart.checkout': 'Zur Kasse gehen',
    'cart.checkoutBtn': 'Zur Kasse gehen',
    'cart.continue': 'Weiter einkaufen',
    'cart.promo': 'Gutscheincode aktiv: BLUE20',

    // Checkout
    'checkout.title': 'Sichere Kasse',
    'checkout.stripe': 'Verschlüsselt mit Stripe 256-Bit SSL',
    'checkout.step1': 'Lieferadresse',
    'checkout.step2': 'Zahlungsmethode',
    'checkout.placeOrder': 'Zahlungspflichtig bestellen',
    'checkout.orderSuccess': 'Bestellung erfolgreich aufgegeben!',
    'checkout.summaryTitle': 'Bestellübersicht & Wesentliche Merkmale (§ 312j BGB)',
    'checkout.legalNotice': 'Ich habe die Allgemeinen Geschäftsbedingungen (AGB) und die Widerrufsbelehrung zur Kenntnis genommen und erkläre mich mit deren Geltung einverstanden. Die Datenschutzerklärung habe ich zur Kenntnis genommen.',
    'checkout.vatNotice': 'Alle Preise verstehen sich als Endpreise inklusive der gesetzlichen deutschen Mehrwertsteuer (19% MwSt.).',
    'checkout.methodCard': 'Kredit- / Debitkarte',
    'checkout.methodPaypal': 'PayPal',
    'checkout.methodKlarna': 'Klarna',
    'checkout.methodSepa': 'SEPA-Lastschrift',
    'checkout.methodGiropay': 'Giropay / Wero',
    'checkout.methodApplePay': 'Apple Pay / Google Pay',
    'checkout.dummyNotice': 'Demo-Sandbox aktiv • Sofortige Simulation ohne Echtgeld-Abbuchung',

    // Tracking
    'tracking.title': 'Echtzeit-Sendungsverfolgung',
    'tracking.placeholder': 'Bestellnummer eingeben (z.B. BC-2026-8910)',
    'tracking.trackBtn': 'Sendung verfolgen',

    // Auth Pages
    'auth.customerLoginTitle': 'Kunden-Anmeldung',
    'auth.customerLoginSub': 'Melden Sie sich an, um Bestellungen, Adressen und den Express-Checkout zu nutzen.',
    'auth.customerRegisterTitle': 'Neues Kundenkonto erstellen',
    'auth.customerRegisterSub': 'Registrieren Sie sich bei BlueCart für exklusive Angebote und Live-Paketupdates.',
    'auth.adminLoginTitle': 'Administrator-Zugang',
    'auth.adminLoginSub': 'Geschützte Verwaltungskonsole für Katalog, Lagerbestände und Umsatzstatistiken.',
    'auth.email': 'E-Mail-Adresse',
    'auth.password': 'Passwort',
    'auth.fullName': 'Vollständiger Name',
    'auth.country': 'Land / Region',
    'auth.city': 'Stadt',
    'auth.createAccountBtn': 'Konto jetzt erstellen',
    'auth.signInBtn': 'Anmelden',
    'auth.adminSignInBtn': 'Als Administrator einloggen',
    'auth.noAccount': 'Noch kein Kundenkonto?',
    'auth.alreadyAccount': 'Bereits registriert?',
    'auth.isAdminPrompt': 'Zur Store-Verwaltung?',
    'auth.isCustomerPrompt': 'Zurück zum Kunden-Shop',
    'auth.demoNotice': '1-Klick Demo-Zugang:',

    // Footer
    'footer.about': 'Über BlueCart',
    'footer.aboutDesc': 'Ihr Fachhändler für moderne Lifestyle-Essentials sowie erstklassige deutsche Handwerkskunst und Feinkost-Spezialitäten.',
    'footer.service': 'Kundenservice',
    'footer.contact': 'Kontakt & Kundendienst',
    'footer.faq': 'Hilfe & Häufige Fragen',
    'footer.shippingInfo': 'Versand & Lieferung',
    'footer.returns': '30 Tage Rückgaberecht',
    'footer.legal': 'Rechtliches & Sicherheit',
    'footer.impressum': 'Impressum',
    'footer.privacy': 'Datenschutzerklärung (DSGVO)',
    'footer.terms': 'Allgemeine Geschäftsbedingungen (AGB)',
    'footer.revocation': 'Widerrufsbelehrung & Musterformular (§ 312d BGB)',
    'footer.battery': 'Batterie- & Entsorgungshinweise (BattG / ElektroG)',
    'footer.cookies': 'Cookie-Einstellungen (§ 25 TDDDG)',
    'footer.paymentMethods': 'Sichere Zahlungsarten',
    'footer.newsletter': 'Newsletter & 10% Rabatt',
    'footer.newsletterSub': 'Erhalten Sie wöchentliche Blitzangebote und exklusive Neuheiten direkt per E-Mail.',
    'footer.subscribe': 'Anmelden',
    'footer.rights': 'Alle Rechte vorbehalten.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('de');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language][key] || fallback || key;
  };

  const formatPrice = (amount?: number | null): string => {
    const num = typeof amount === 'number' && !isNaN(amount) ? amount : (Number(amount) || 0);
    if (language === 'de') {
      // Standard German price notation: 49,99 €
      return `${num.toFixed(2).replace('.', ',')} €`;
    }
    // Standard European English price notation for German store: €49.99
    return `€${num.toFixed(2)}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
