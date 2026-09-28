import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { EUROPEAN_COUNTRIES } from '../data/europeanCountries';
import {
  X,
  User,
  Mail,
  Smartphone,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Save,
  Bell,
  Package,
  Calendar,
  Clock,
  Sparkles,
  RotateCcw,
  LogOut,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrders?: () => void;
  onOpenReturns?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenOrders,
  onOpenReturns,
}) => {
  const { user, updateProfile, logout } = useAuth();
  const { language, t } = useLanguage();

  if (!isOpen || !user) return null;

  // Form states initialized from user profile
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.whatsapp_number || user.phone || '');
  const [country, setCountry] = useState(user.address?.country || 'Germany');
  const [city, setCity] = useState(user.address?.city || 'München');
  const [street, setStreet] = useState(user.address?.street || 'Maximilianstraße 12');
  const [zip, setZip] = useState(user.address?.zip || '80331');
  const [packstation, setPackstation] = useState(user.address?.packstation || '');

  // Preferences
  const [waOrderUpdates, setWaOrderUpdates] = useState(
    user.preferences?.whatsapp_order_updates ?? true
  );
  const [waShippingAlerts, setWaShippingAlerts] = useState(
    user.preferences?.whatsapp_shipping_alerts ?? true
  );
  const [waDeals, setWaDeals] = useState(user.preferences?.whatsapp_deals ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Find matched European country
  const matchedCountry =
    EUROPEAN_COUNTRIES.find(
      (c) =>
        c.code.toUpperCase() === (user.whatsapp_country_code || '').toUpperCase() ||
        c.name.toLowerCase() === (user.address?.country || '').toLowerCase()
    ) || EUROPEAN_COUNTRIES[0];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({
        name,
        email,
        phone,
        whatsapp_number: phone,
        address: {
          street,
          city,
          zip,
          country,
          packstation: packstation || undefined,
        },
        preferences: {
          whatsapp_order_updates: waOrderUpdates,
          whatsapp_shipping_alerts: waShippingAlerts,
          whatsapp_deals: waDeals,
          language: language,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {user.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {/* WhatsApp European Verification Badge Card */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      European WhatsApp Account
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                    Phone:{' '}
                    <strong className="font-mono text-emerald-700 dark:text-emerald-300">
                      {user.whatsapp_number || user.phone || `${matchedCountry.dialCode} (Active)`}
                    </strong>{' '}
                    • {matchedCountry.flag} {matchedCountry.name}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Connected for instant DHL tracking updates, express European checkout, and customer support.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 sm:text-right">
                <span className="block font-medium">Auth Provider:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold uppercase">
                  {user.auth_provider || 'whatsapp_otp'}
                </span>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Your profile and European address have been saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Personal Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Account Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    WhatsApp Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+49 170 1234567"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs"
                  />
                </div>
              </div>
            </div>

            {/* European Shipping Address */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>European Delivery Address</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Street & House Number
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. Maximilianstraße 12"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Postal Code (PLZ)
                  </label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="80331"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    City / Ort
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="München"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Country (Europe)
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none text-xs"
                  >
                    {EUROPEAN_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    DHL Packstation or Pickup Point (Optional)
                  </label>
                  <input
                    type="text"
                    value={packstation}
                    onChange={(e) => setPackstation(e.target.value)}
                    placeholder="e.g. Packstation 102, PostNummer: 9812471"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-600 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Notifications Settings */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Notification Preferences</span>
              </h3>

              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Order Confirmations & Tracking
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Receive immediate receipt and DHL live tracking links on WhatsApp
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={waOrderUpdates}
                    onChange={(e) => setWaOrderUpdates(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-2" />

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Delivery & Courier Alerts
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Get notified when your parcel is out for delivery or at the Packstation
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={waShippingAlerts}
                    onChange={(e) => setWaShippingAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-2" />

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      VIP WhatsApp Member Deals
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Exclusive European discounts & flash sale early access
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={waDeals}
                    onChange={(e) => setWaDeals(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Created: {new Date(user.created_at).toLocaleDateString()}
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>

          {/* Quick shortcuts */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {onOpenOrders && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrders();
                }}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Package className="w-4 h-4 text-blue-600" />
                <span>View My Orders & Invoices</span>
              </button>
            )}

            {onOpenReturns && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReturns();
                }}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <span>14-Day Returns Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={async () => {
              onClose();
              await logout();
            }}
            className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
