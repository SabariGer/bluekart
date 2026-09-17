import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  RotateCcw,
  Scale,
  Truck,
  Recycle,
  ExternalLink,
  Copy,
  Check,
  Building,
  Mail,
  Phone,
  Printer,
  Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type LegalTab = 'impressum' | 'privacy' | 'terms' | 'revocation' | 'shipping' | 'battery';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'impressum',
  onClose,
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [copiedForm, setCopiedForm] = useState(false);

  // Sync initialTab when modal opens
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const sampleRevocationText = `Muster-Widerrufsformular
(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)

An:
BlueCart Retail GmbH
Kundenservice & Retouren
Maximiliansplatz 14
80333 München, Deutschland
E-Mail: widerruf@bluecart.store
Telefon: +49 (0) 89 244-1188

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*):
Bestellt am (*): ______________ / Erhalten am (*): ______________
Bestellnummer: _________________________________________________
Name des/der Verbraucher(s): __________________________________
Anschrift des/der Verbraucher(s): ______________________________
_________________________________________________________________
Datum: _______________________
Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):
_________________________________________________________________
(*) Unzutreffendes streichen.`;

  const handleCopyForm = () => {
    navigator.clipboard.writeText(sampleRevocationText);
    setCopiedForm(true);
    setTimeout(() => setCopiedForm(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-10 overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{language === 'de' ? 'Rechtliche Informationen & Verbraucherschutz' : 'Legal Information & Consumer Compliance'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  {language === 'de' ? 'Deutsches Recht (BGB / DDG / DSGVO)' : 'German Law Compliant'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'de'
                  ? 'Gültig für alle Einkäufe bei der BlueCart Retail GmbH (Deutschland & EU)'
                  : 'Applicable to all purchases with BlueCart Retail GmbH (Germany & EU)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title={language === 'de' ? 'Drucken' : 'Print'}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'de' ? 'Drucken' : 'Print'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 overflow-x-auto shrink-0 scrollbar-none gap-1 py-2">
          <button
            onClick={() => setActiveTab('impressum')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'impressum'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Impressum (§ 5 DDG)</span>
          </button>

          <button
            onClick={() => setActiveTab('revocation')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'revocation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'de' ? 'Widerrufsbelehrung & Formular' : 'Right of Withdrawal (§ 312d BGB)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'de' ? 'AGB (§ 305 BGB)' : 'Terms & Conditions (AGB)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'de' ? 'Datenschutz (DSGVO)' : 'Privacy Policy (GDPR)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'shipping'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{language === 'de' ? 'Versand & MwSt.' : 'Shipping & VAT (PAngV)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('battery')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'battery'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Recycle className="w-3.5 h-3.5" />
            <span>{language === 'de' ? 'BattG & ElektroG' : 'Battery & Waste Notice'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: IMPRESSUM (§ 5 DDG) */}
          {activeTab === 'impressum' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-300">
                  <p className="font-bold">Anbieterkennzeichnung gemäß § 5 Digitale-Dienste-Gesetz (DDG):</p>
                  <p className="mt-0.5">Diese Angaben sind gesetzlich vorgeschrieben und bieten Ihnen volle Transparenz über den Betreiber dieses Online-Shops.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Angaben gemäß § 5 DDG</h3>
                  <p className="font-semibold text-slate-900 dark:text-white">BlueCart Retail GmbH</p>
                  <p>Maximiliansplatz 14</p>
                  <p>80333 München, Deutschland</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <p><strong className="text-slate-900 dark:text-white">Vertretungsberechtigte Geschäftsführer:</strong></p>
                    <p>Dr. Julian Bergmann, Katharina Weiss</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Kontakt & Registereintrag</h3>
                  <div className="space-y-1 text-xs">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Telefon: +49 (0) 89 244-1188 (Mo-Fr 08:00 - 18:00 Uhr)</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>E-Mail: impressum@bluecart.store / support@bluecart.store</span>
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                      <p><strong className="text-slate-900 dark:text-white">Registergericht:</strong> Amtsgericht München</p>
                      <p><strong className="text-slate-900 dark:text-white">Registernummer:</strong> HRB 267190</p>
                      <p><strong className="text-slate-900 dark:text-white">Umsatzsteuer-Identifikationsnummer (§ 27a UStG):</strong> DE 349 182 905</p>
                      <p><strong className="text-slate-900 dark:text-white">LUCID-Verpackungsregister:</strong> DE49182390184</p>
                      <p><strong className="text-slate-900 dark:text-white">WEEE-Reg.-Nr. (ElektroG):</strong> DE 89234812</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                  Verantwortlich für den redaktionellen Inhalt nach § 18 Abs. 2 MStV
                </h4>
                <p>
                  Dr. Julian Bergmann, Maximiliansplatz 14, 80333 München, Deutschland.
                </p>
              </div>

              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                  EU-Streitschlichtung & Verbraucherstreitbeilegung (§ 36 VSBG)
                </h4>
                <p className="mb-2">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit, die Sie unter folgendem Link finden:{' '}
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>https://ec.europa.eu/consumers/odr</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Wir sind nicht verpflichtet und grundsätzlich nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Unser Kundenservice steht Ihnen jedoch jederzeit unter <span className="font-mono text-slate-700 dark:text-slate-300">support@bluecart.store</span> zur Verfügung.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: WIDERRUFSBELEHRUNG & MUSTER-WIDERRUFSFORMULAR (§ 312d BGB) */}
          {activeTab === 'revocation' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 dark:text-emerald-300">
                  <p className="font-bold">Gesetzliches Widerrufsrecht für Verbraucher (§ 312g i.V.m. § 355 BGB):</p>
                  <p className="mt-0.5">Als Verbraucher haben Sie das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. BlueCart gewährt darüber hinaus ein freiwilliges Rückgaberecht von insgesamt 30 Tagen.</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">Widerrufsbelehrung</h3>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-3 mb-1">Widerrufsrecht</h4>
                <p>
                  Sie haben das Recht, binnen vierzehn Tagen ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat, diesen Vertrag zu widerrufen.
                </p>
                <p className="mt-2">
                  Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (BlueCart Retail GmbH, Maximiliansplatz 14, 80333 München, Deutschland, E-Mail: widerruf@bluecart.store, Telefon: +49 (0) 89 244-1188) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
                </p>

                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-4 mb-1">Folgen des Widerrufs</h4>
                <p>
                  Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart.
                </p>
                <p className="mt-2">
                  Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist. Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben.
                </p>
              </div>

              {/* Sample Revocation Form Box */}
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Muster-Widerrufsformular gemäß Anlage 2 zu Art. 246a § 1 Abs. 2 Satz 1 Nr. 1 EGBGB
                  </h4>
                  <button
                    onClick={handleCopyForm}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedForm ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Formular kopieren</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                  {sampleRevocationText}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: ALLGEMEINE GESCHÄFTSBEDINGUNGEN (AGB) */}
          {activeTab === 'terms' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Allgemeine Geschäftsbedingungen (AGB) der BlueCart Retail GmbH
              </h3>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">§ 1 Geltungsbereich und Anbieter</h4>
                <p>
                  (1) Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen, die Verbraucher (§ 13 BGB) oder Unternehmer (§ 14 BGB) über den Online-Shop der BlueCart Retail GmbH, Maximiliansplatz 14, 80333 München, HRB 267190, tätigen.
                </p>
                <p>
                  (2) Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">§ 2 Vertragsschluss & Button-Lösung (§ 312j BGB)</h4>
                <p>
                  (1) Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot, sondern eine unverbindliche Aufforderung zur Bestellung dar.
                </p>
                <p>
                  (2) Durch Anklicken des mit der gesetzlichen Pflichtbeschriftung versehenen Buttons <strong>„Zahlungspflichtig bestellen“</strong> gibt der Kunde eine verbindliche Bestellung der im Warenkorb enthaltenen Waren ab.
                </p>
                <p>
                  (3) Die Bestätigung des Eingangs der Bestellung erfolgt unmittelbar nach dem Absenden der Bestellung durch eine automatisierte Bestätigungs-E-Mail. Der Vertrag kommt mit unserer Auftragsbestätigung oder Zusendung der Ware zustande.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">§ 3 Preise, Mehrwertsteuer und Versandkosten (§ 1 PAngV)</h4>
                <p>
                  (1) Alle auf den Produktseiten genannten Preise sind <strong>Endpreise in Euro (EUR)</strong> und enthalten die gesetzliche deutsche Mehrwertsteuer (19% bzw. 7% für ermäßigte Spezialitäten) gemäß der Preisangabenverordnung (PAngV).
                </p>
                <p>
                  (2) Zusätzlich zu den angegebenen Preisen berechnen wir für die Lieferung innerhalb Deutschlands standardmäßig 4,99 € (DHL Express). Ab einem Bestellwert von 50,00 € liefern wir versandkostenfrei.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">§ 4 Zahlungsbedingungen</h4>
                <p>
                  Die Zahlung erfolgt wahlweise über Kreditkarte (Stripe 256-Bit SSL), Klarna, PayPal, Apple Pay oder autorisierte SEPA-Verfahren. Bei Zahlung per Kreditkarte erfolgt die Belastung Ihres Kontos unmittelbar nach Abschluss der Bestellung.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">§ 5 Eigentumsvorbehalt (§ 449 BGB)</h4>
                <p>
                  Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">§ 6 Gesetzliches Mängelhaftungsrecht (Gewährleistung)</h4>
                <p>
                  Es gelten die gesetzlichen Mängelhaftungsrechte gemäß §§ 437 ff. BGB. Die Verjährungsfrist für gesetzliche Mängelansprüche beträgt bei Neuwaren 24 Monate ab Übergabe der Ware.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">§ 7 Anwendbares Recht & Gerichtsstand</h4>
                <p>
                  Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts (CISG). Wenn der Kunde Verbraucher ist und seinen gewöhnlichen Aufenthalt in einem anderen EU-Staat hat, bleiben zwingende Verbraucherschutzvorschriften dieses Staates unberührt.
                </p>
              </section>
            </div>
          )}

          {/* TAB 4: DATENSCHUTZERKLÄRUNG (DSGVO / GDPR) */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  Datenschutzerklärung gemäß Art. 13, 14 DSGVO & § 25 TDDDG
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Der Schutz Ihrer personenbezogenen Daten hat für die BlueCart Retail GmbH höchste Priorität.
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Name und Kontaktdaten des Verantwortlichen</h4>
                <p>
                  BlueCart Retail GmbH, Maximiliansplatz 14, 80333 München, Deutschland, E-Mail: datenschutz@bluecart.store, Tel.: +49 (0) 89 244-1188.
                </p>
                <p>Datenschutzbeauftragter: Erreichbar unter dpo@bluecart.store.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Rechtsgrundlagen der Datenverarbeitung</h4>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Art. 6 Abs. 1 lit. b DSGVO:</strong> Zur Erfüllung von Kaufverträgen, Auslieferung von Waren und Zahlungsabwicklung.</li>
                  <li><strong>Art. 6 Abs. 1 lit. c DSGVO:</strong> Zur Erfüllung gesetzlicher Aufbewahrungsfristen (z.B. § 147 AO, § 257 HGB).</li>
                  <li><strong>Art. 6 Abs. 1 lit. a DSGVO / § 25 Abs. 1 TDDDG:</strong> Sofern Sie uns eine ausdrückliche Einwilligung erteilt haben (z.B. für funktionale Cookies oder Newsletter).</li>
                  <li><strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Zur Wahrung unserer berechtigten Interessen an der Sicherheit des Shopsystems und Missbrauchsverhinderung.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Zahlungsdienstleister: Stripe</h4>
                <p>
                  Zur sicheren Zahlungsabwicklung nutzen wir den Dienst <strong>Stripe Payments Europe, Ltd.</strong>, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland. Die Datenübertragung erfolgt verschlüsselt über modernste 256-Bit SSL-Zertifikate. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Versanddienstleister: DHL Paket</h4>
                <p>
                  Zur Zustellung Ihrer Bestellungen übermitteln wir Name und Lieferanschrift an die <strong>DHL Paket GmbH</strong>, Sträßchensweg 10, 53113 Bonn. Zum Zwecke der Paketankündigung übermitteln wir mit Ihrer Einwilligung auch Ihre E-Mail-Adresse.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">5. Ihre Betroffenenrechte nach der DSGVO</h4>
                <p>Sie haben nach der DSGVO jederzeit folgende Rechte:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong>Art. 15 DSGVO:</strong> Auskunftsrecht über Ihre gespeicherten Daten
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong>Art. 16 DSGVO:</strong> Recht auf unverzügliche Berichtigung
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong>Art. 17 DSGVO:</strong> Recht auf Löschung („Recht auf Vergessenwerden“)
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong>Art. 20 DSGVO:</strong> Recht auf Datenübertragbarkeit
                  </div>
                </div>
                <p className="mt-2 text-xs">
                  Zuständige Aufsichtsbehörde: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.
                </p>
              </section>
            </div>
          )}

          {/* TAB 5: VERSAND & PREISE (PAngV) */}
          {activeTab === 'shipping' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Versandkosten, Lieferzeiten & Preisangabenverordnung (PAngV)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <span className="text-xs font-bold text-blue-600 uppercase">Lieferzeit Deutschland</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-1">1–3 Werktage</p>
                  <p className="text-xs text-slate-500 mt-0.5">Schnelle Zustellung mit DHL Express & Live-Tracking</p>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-bold text-emerald-600 uppercase">Kostenloser Versand</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-1">Ab 50,00 €</p>
                  <p className="text-xs text-slate-500 mt-0.5">Versandkostenfrei für alle Warenkörbe ab 50 €</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Standard-Versandkosten</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-1">4,99 €</p>
                  <p className="text-xs text-slate-500 mt-0.5">Pauschal für Bestellungen unter 50 €</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Hinweis zur Preisangabenverordnung (§ 1 Abs. 2 PAngV)
                </h4>
                <p>
                  Sämtliche auf unserer Plattform ausgewiesenen Preise sind Endpreise. Sie verstehen sich inklusive der jeweils gültigen gesetzlichen Mehrwertsteuer (Regelsatz 19% bzw. 7% für Lebensmittel) und sonstiger Preisbestandteile.
                </p>
                <p>
                  Die anfallenden Versandkosten werden im Warenkorb und in der verbindlichen Bestellübersicht vor Abgabe Ihrer zahlungspflichtigen Bestellung deutlich ausgewiesen.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  Klimaneutraler Versand mit DHL GoGreen
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Alle unsere Pakete werden zu 100% mit DHL GoGreen transportiert. Die durch den Transport entstandenen Treibhausgasemissionen werden durch zertifizierte Klimaschutzprojekte ausgeglichen.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: BATTERIEGESETZ & ELEKTROGESETZ */}
          {activeTab === 'battery' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Hinweise zur Entsorgung von Batterien, Akkus und Elektrogeräten
              </h3>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                  1. Hinweise zur Batterieentsorgung gemäß § 18 Batteriegesetz (BattG)
                </h4>
                <p className="text-xs text-amber-950 dark:text-amber-200">
                  Da in unseren Sendungen Batterien und Akkumulatoren enthalten sein können, sind wir nach dem Batteriegesetz (BattG) verpflichtet, Sie auf Folgendes hinzuweisen:
                </p>
                <p className="text-xs text-amber-950 dark:text-amber-200">
                  Batterien dürfen nicht im Hausmüll entsorgt werden! Sie sind als Endnutzer gesetzlich zur Rückgabe gebrauchter Batterien verpflichtet. Sie können Altbatterien nach Gebrauch bei kommunalen Sammelstellen oder im Handel unentgeltlich zurückgeben.
                </p>
                <p className="text-xs font-mono text-amber-950 dark:text-amber-300">
                  Das Symbol der durchgekreuzten Mülltonne bedeutet, dass Batterien nicht in den Hausmüll geworfen werden dürfen. Unter dem Symbol finden sich ggf. chemische Bezeichnungen: Pb = Blei (&gt; 0,004 %), Cd = Cadmium (&gt; 0,002 %), Hg = Quecksilber (&gt; 0,0005 %).
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  2. Entsorgung von Elektro- und Elektronikgeräten (ElektroG)
                </h4>
                <p className="text-xs">
                  Elektro- und Elektronikgeräte dürfen nicht über den Hausmüll entsorgt werden. Besitzer von Altgeräten haben diese einer vom unsortierten Siedlungsabfall getrennten Erfassung zuzuführen.
                </p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  WEEE-Registrierungsnummer der BlueCart Retail GmbH: DE 89234812
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  3. Registrierung im Verpackungsregister LUCID (VerpackG)
                </h4>
                <p className="text-xs">
                  Gemäß den Vorgaben des deutschen Verpackungsgesetzes (VerpackG) sind wir bei der Stiftung Zentrale Stelle Verpackungsregister (ZSVR) unter der Registrierungsnummer <strong>DE49182390184</strong> registriert und an ein lizenziertes duales Entsorgungssystem angeschlossen.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>BlueCart Retail GmbH • Stand: 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {language === 'de' ? 'Schließen' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
