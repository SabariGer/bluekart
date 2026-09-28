import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  EUROPEAN_COUNTRIES,
  EuropeanCountry,
  validateEuropeanPhone,
} from '../../data/europeanCountries';
import {
  Smartphone,
  Mail,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  RefreshCw,
  ChevronDown,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface EuropeanWhatsappLoginProps {
  onSuccess?: () => void;
  onNavigateToPassword?: () => void;
}

export const EuropeanWhatsappLogin: React.FC<EuropeanWhatsappLoginProps> = ({
  onSuccess,
  onNavigateToPassword,
}) => {
  const { sendOtp, verifyOtp, loginAsDemo } = useAuth();
  const { language, t } = useLanguage();

  // Mode: WhatsApp or Email
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');

  // Country selection (European)
  const [selectedCountry, setSelectedCountry] = useState<EuropeanCountry>(EUROPEAN_COUNTRIES[0]); // Germany DE default
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Inputs
  const [phoneDigits, setPhoneDigits] = useState('1701234567'); // Default test number for Munich
  const [emailInput, setEmailInput] = useState('lukas.schneider@example.de');
  const [customerName, setCustomerName] = useState('');

  // OTP State
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpSessionId, setOtpSessionId] = useState<string | undefined>();
  const [previewOtpCode, setPreviewOtpCode] = useState<string | undefined>();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // European Phone validation calculation
  const phoneValidation = validateEuropeanPhone(phoneDigits, selectedCountry.code);

  // Timer countdown for resend
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const identifier =
      channel === 'whatsapp' ? phoneValidation.formattedInternational : emailInput.trim();

    if (channel === 'whatsapp') {
      if (!phoneValidation.isValid) {
        setErrorMessage(phoneValidation.error || 'Please enter a valid European WhatsApp number.');
        return;
      }
    } else {
      if (!emailInput.includes('@') || !emailInput.includes('.')) {
        setErrorMessage('Please enter a valid European email address.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await sendOtp({
        identifier,
        channel,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
      });

      if (res.success) {
        setOtpSessionId(res.otpId);
        setPreviewOtpCode(res.previewOtp);
        setStep('otp');
        setResendCooldown(45); // 45s countdown
        setOtpDigits(['', '', '', '', '', '']);
      } else {
        setErrorMessage(res.error || 'Could not send verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error requesting verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Digit input changes
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      // User pasted multiple digits
      const pasted = clean.slice(0, 6).split('');
      const nextOtp = [...otpDigits];
      pasted.forEach((ch, idx) => {
        if (index + idx < 6) nextOtp[index + idx] = ch;
      });
      setOtpDigits(nextOtp);
      const nextFocus = Math.min(index + pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      if (nextOtp.every((d) => d.length === 1)) {
        executeVerify(nextOtp.join(''));
      }
      return;
    }

    const nextOtp = [...otpDigits];
    nextOtp[index] = clean;
    setOtpDigits(nextOtp);

    // Auto-focus next input
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // If filled all 6 digits, auto submit
    if (clean && index === 5) {
      const fullCode = nextOtp.join('');
      if (fullCode.length === 6) {
        executeVerify(fullCode);
      }
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Execute OTP Verification
  const executeVerify = async (codeToVerify: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const identifier =
      channel === 'whatsapp' ? phoneValidation.formattedInternational : emailInput.trim();

    try {
      const res = await verifyOtp({
        identifier,
        otp: codeToVerify,
        otpId: otpSessionId,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        name: customerName.trim() || undefined,
      });

      if (res.success) {
        setSuccessMessage(`Welcome! Verified via European ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}. Loading your profile...`);
        if (onSuccess) {
          setTimeout(() => onSuccess(), 600);
        }
      } else {
        setErrorMessage(res.error || 'Verification code failed. Please check the digits.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFillCode = () => {
    if (previewOtpCode) {
      const digits = previewOtpCode.split('');
      setOtpDigits(digits);
      executeVerify(previewOtpCode);
    }
  };

  // Quick preset test buttons for European countries
  const handlePickPreset = (countryCode: string, sample: string, sampleName: string) => {
    const found = EUROPEAN_COUNTRIES.find((c) => c.code === countryCode) || EUROPEAN_COUNTRIES[0];
    setSelectedCountry(found);
    setPhoneDigits(sample);
    setCustomerName(sampleName);
    setChannel('whatsapp');
    setErrorMessage(null);
  };

  // Filter countries in selector dropdown
  const filteredCountries = EUROPEAN_COUNTRIES.filter((c) => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.name_de.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full">
      {/* Channel Switcher: European WhatsApp vs Email */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-5 text-xs font-semibold border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setChannel('whatsapp');
            setErrorMessage(null);
          }}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            channel === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="text-base leading-none">🟢</span>
          <span>European WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setChannel('email');
            setErrorMessage(null);
          }}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            channel === 'email'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email OTP</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-2xl">
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      {/* STEP 1: Phone / Email Input Screen */}
      {step === 'input' && (
        <div>
          {/* Quick 1-Click European Shoppers Test Presets */}
          <div className="mb-5 p-3.5 bg-gradient-to-br from-emerald-50/70 to-blue-50/50 dark:from-emerald-950/30 dark:to-blue-950/20 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Test with Verified European Numbers</span>
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">1-Click Fill</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handlePickPreset('DE', '1701234567', 'Lukas Schneider (München)')}
                className="p-1.5 bg-white dark:bg-slate-800 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span>🇩🇪</span> <span>DE +49</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">München</div>
              </button>

              <button
                type="button"
                onClick={() => handlePickPreset('FR', '612345678', 'Claire Dubois (Paris)')}
                className="p-1.5 bg-white dark:bg-slate-800 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span>🇫🇷</span> <span>FR +33</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Paris</div>
              </button>

              <button
                type="button"
                onClick={() => handlePickPreset('GB', '7700900123', 'Oliver Smith (London)')}
                className="p-1.5 bg-white dark:bg-slate-800 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span>🇬🇧</span> <span>UK +44</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">London</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            {/* WhatsApp Phone Section */}
            {channel === 'whatsapp' ? (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  European WhatsApp Phone Number
                </label>

                {/* Country + Phone input group */}
                <div className="relative">
                  <div className="flex rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/40 transition-all">
                    {/* Country Selector Dropdown Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-r border-slate-200 dark:border-slate-700 rounded-l-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                    >
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span>{selectedCountry.dialCode}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* National Phone Input */}
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={phoneDigits}
                        onChange={(e) => setPhoneDigits(e.target.value)}
                        placeholder={`e.g. ${selectedCountry.placeholder}`}
                        className="w-full px-3 py-2.5 bg-transparent text-slate-900 dark:text-white rounded-r-2xl outline-none font-medium text-sm placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Dropdown for European Countries */}
                  {isCountryDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsCountryDropdownOpen(false)}
                      />
                      <div className="absolute left-0 top-full mt-2 w-72 max-h-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-40 overflow-hidden flex flex-col">
                        <div className="p-1 mb-1">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search European country..."
                            className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto flex-1 space-y-0.5">
                          {filteredCountries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country);
                                setIsCountryDropdownOpen(false);
                                setCountrySearch('');
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                                selectedCountry.code === country.code
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{country.flag}</span>
                                <span className="truncate">
                                  {language === 'de' ? country.name_de : country.name}
                                </span>
                              </div>
                              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                {country.dialCode}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Live European Validation Indicator */}
                <div className="mt-2 text-[11px]">
                  {phoneValidation.isValid ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Valid European WhatsApp Number: <strong className="font-mono">{phoneValidation.formattedInternational}</strong> ({selectedCountry.name})
                      </span>
                    </div>
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400">
                      Standard format for {selectedCountry.name}: <span className="font-mono">{selectedCountry.dialCode} {selectedCountry.placeholder}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  European Customer Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. lukas.schneider@example.de"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all text-xs"
                  />
                </div>
              </div>
            )}

            {/* Optional Name for New Profile */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Your Full Name <span className="text-slate-400 font-normal">(for European delivery profile)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Lukas Schneider"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 outline-none transition-all text-xs"
              />
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading || (channel === 'whatsapp' && !phoneValidation.isValid)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <span>{isLoading ? 'Dispatching OTP...' : channel === 'whatsapp' ? 'Send WhatsApp Verification Code' : 'Send Email OTP Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: 6-Digit OTP Verification Screen */}
      {step === 'otp' && (
        <div className="space-y-4">
          {/* Back link */}
          <button
            type="button"
            onClick={() => {
              setStep('input');
              setErrorMessage(null);
            }}
            className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change number or email</span>
          </button>

          {/* Delivery target confirmation card */}
          <div className="p-3 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">{channel === 'whatsapp' ? '🟢' : '✉️'}</span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {channel === 'whatsapp' ? phoneValidation.formattedInternational : emailInput}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {channel === 'whatsapp' ? `WhatsApp Message (${selectedCountry.name})` : 'Email Delivery'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Code Dispatched
            </span>
          </div>

          {/* Interactive Simulated WhatsApp Message Banner */}
          {previewOtpCode && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Incoming WhatsApp Notification</span>
                </span>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">EU Verified</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 mb-2 font-mono">
                "BlueCart Retail Europe: Your verification code is <strong className="text-emerald-700 dark:text-emerald-300 text-sm tracking-wider">{previewOtpCode}</strong>. Valid for 5 minutes."
              </p>
              <button
                type="button"
                onClick={handleAutoFillCode}
                className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Auto-Fill Code ({previewOtpCode})</span>
              </button>
            </div>
          )}

          {/* 6-Digit Boxes */}
          <div className="py-2">
            <label className="block text-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex justify-between gap-1.5 sm:gap-2 max-w-xs mx-auto">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e)}
                  className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 outline-none transition-all shadow-2xs"
                />
              ))}
            </div>
          </div>

          {/* Manual Submit Button */}
          <button
            type="button"
            disabled={isLoading || otpDigits.some((d) => !d)}
            onClick={() => executeVerify(otpDigits.join(''))}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Resend actions & countdown */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
            {resendCooldown > 0 ? (
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setChannel(channel === 'whatsapp' ? 'email' : 'whatsapp');
                setStep('input');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-[11px]"
            >
              Switch to {channel === 'whatsapp' ? 'Email OTP' : 'WhatsApp OTP'}
            </button>
          </div>
        </div>
      )}

      {/* Switch to standard password or demo */}
      {onNavigateToPassword && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={onNavigateToPassword}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer inline-flex items-center gap-1 font-medium"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Use standard password or demo account instead</span>
          </button>
        </div>
      )}
    </div>
  );
};
