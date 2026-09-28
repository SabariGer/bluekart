export interface EuropeanCountry {
  code: string; // ISO 2-letter
  name: string;
  name_de: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  sampleNumber: string;
  minLength: number;
  maxLength: number;
  mobilePattern: RegExp;
  defaultCity: string;
  defaultZip: string;
  currency: string;
}

export const EUROPEAN_COUNTRIES: EuropeanCountry[] = [
  {
    code: 'DE',
    name: 'Germany',
    name_de: 'Deutschland',
    dialCode: '+49',
    flag: '🇩🇪',
    placeholder: '170 1234567',
    sampleNumber: '1701234567',
    minLength: 10,
    maxLength: 11,
    mobilePattern: /^(15\d|16\d|17\d)\d{7,8}$/,
    defaultCity: 'München',
    defaultZip: '80331',
    currency: 'EUR',
  },
  {
    code: 'AT',
    name: 'Austria',
    name_de: 'Österreich',
    dialCode: '+43',
    flag: '🇦🇹',
    placeholder: '664 1234567',
    sampleNumber: '6641234567',
    minLength: 10,
    maxLength: 11,
    mobilePattern: /^6\d{8,10}$/,
    defaultCity: 'Wien',
    defaultZip: '1010',
    currency: 'EUR',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    name_de: 'Schweiz',
    dialCode: '+41',
    flag: '🇨🇭',
    placeholder: '79 123 45 67',
    sampleNumber: '791234567',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^7[5-9]\d{7}$/,
    defaultCity: 'Zürich',
    defaultZip: '8001',
    currency: 'CHF',
  },
  {
    code: 'FR',
    name: 'France',
    name_de: 'Frankreich',
    dialCode: '+33',
    flag: '🇫🇷',
    placeholder: '6 12 34 56 78',
    sampleNumber: '612345678',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^[67]\d{8}$/,
    defaultCity: 'Paris',
    defaultZip: '75001',
    currency: 'EUR',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    name_de: 'Großbritannien',
    dialCode: '+44',
    flag: '🇬🇧',
    placeholder: '7700 900123',
    sampleNumber: '7700900123',
    minLength: 10,
    maxLength: 10,
    mobilePattern: /^7\d{9}$/,
    defaultCity: 'London',
    defaultZip: 'SW1A 1AA',
    currency: 'GBP',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    name_de: 'Niederlande',
    dialCode: '+31',
    flag: '🇳🇱',
    placeholder: '6 12345678',
    sampleNumber: '612345678',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^6\d{8}$/,
    defaultCity: 'Amsterdam',
    defaultZip: '1012 JS',
    currency: 'EUR',
  },
  {
    code: 'BE',
    name: 'Belgium',
    name_de: 'Belgien',
    dialCode: '+32',
    flag: '🇧🇪',
    placeholder: '470 12 34 56',
    sampleNumber: '470123456',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^4\d{8}$/,
    defaultCity: 'Brüssel',
    defaultZip: '1000',
    currency: 'EUR',
  },
  {
    code: 'IT',
    name: 'Italy',
    name_de: 'Italien',
    dialCode: '+39',
    flag: '🇮🇹',
    placeholder: '320 1234567',
    sampleNumber: '3201234567',
    minLength: 9,
    maxLength: 10,
    mobilePattern: /^3\d{8,9}$/,
    defaultCity: 'Rom',
    defaultZip: '00118',
    currency: 'EUR',
  },
  {
    code: 'ES',
    name: 'Spain',
    name_de: 'Spanien',
    dialCode: '+34',
    flag: '🇪🇸',
    placeholder: '612 34 56 78',
    sampleNumber: '612345678',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^[67]\d{8}$/,
    defaultCity: 'Madrid',
    defaultZip: '28001',
    currency: 'EUR',
  },
  {
    code: 'SE',
    name: 'Sweden',
    name_de: 'Schweden',
    dialCode: '+46',
    flag: '🇸🇪',
    placeholder: '70 123 45 67',
    sampleNumber: '701234567',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^7\d{8}$/,
    defaultCity: 'Stockholm',
    defaultZip: '111 22',
    currency: 'SEK',
  },
  {
    code: 'PL',
    name: 'Poland',
    name_de: 'Polen',
    dialCode: '+48',
    flag: '🇵🇱',
    placeholder: '512 345 678',
    sampleNumber: '512345678',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^[5-8]\d{8}$/,
    defaultCity: 'Warschau',
    defaultZip: '00-001',
    currency: 'PLN',
  },
  {
    code: 'DK',
    name: 'Denmark',
    name_de: 'Dänemark',
    dialCode: '+45',
    flag: '🇩🇰',
    placeholder: '20 12 34 56',
    sampleNumber: '20123456',
    minLength: 8,
    maxLength: 8,
    mobilePattern: /^[2-9]\d{7}$/,
    defaultCity: 'Kopenhagen',
    defaultZip: '1050',
    currency: 'DKK',
  },
  {
    code: 'NO',
    name: 'Norway',
    name_de: 'Norwegen',
    dialCode: '+47',
    flag: '🇳🇴',
    placeholder: '412 34 567',
    sampleNumber: '41234567',
    minLength: 8,
    maxLength: 8,
    mobilePattern: /^[49]\d{7}$/,
    defaultCity: 'Oslo',
    defaultZip: '0150',
    currency: 'NOK',
  },
  {
    code: 'FI',
    name: 'Finland',
    name_de: 'Finnland',
    dialCode: '+358',
    flag: '🇫🇮',
    placeholder: '40 123 4567',
    sampleNumber: '401234567',
    minLength: 9,
    maxLength: 10,
    mobilePattern: /^[45]\d{7,8}$/,
    defaultCity: 'Helsinki',
    defaultZip: '00100',
    currency: 'EUR',
  },
  {
    code: 'IE',
    name: 'Ireland',
    name_de: 'Irland',
    dialCode: '+353',
    flag: '🇮🇪',
    placeholder: '87 123 4567',
    sampleNumber: '871234567',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^8[3-9]\d{7}$/,
    defaultCity: 'Dublin',
    defaultZip: 'D01 A1B2',
    currency: 'EUR',
  },
  {
    code: 'PT',
    name: 'Portugal',
    name_de: 'Portugal',
    dialCode: '+351',
    flag: '🇵🇹',
    placeholder: '912 345 678',
    sampleNumber: '912345678',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^9[1-36]\d{7}$/,
    defaultCity: 'Lissabon',
    defaultZip: '1100-001',
    currency: 'EUR',
  },
  {
    code: 'GR',
    name: 'Greece',
    name_de: 'Griechenland',
    dialCode: '+30',
    flag: '🇬🇷',
    placeholder: '691 234 5678',
    sampleNumber: '6912345678',
    minLength: 10,
    maxLength: 10,
    mobilePattern: /^69\d{8}$/,
    defaultCity: 'Athen',
    defaultZip: '105 57',
    currency: 'EUR',
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    name_de: 'Tschechien',
    dialCode: '+420',
    flag: '🇨🇿',
    placeholder: '601 123 456',
    sampleNumber: '601123456',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^[67]\d{8}$/,
    defaultCity: 'Prag',
    defaultZip: '110 00',
    currency: 'CZK',
  },
  {
    code: 'RO',
    name: 'Romania',
    name_de: 'Rumänien',
    dialCode: '+40',
    flag: '🇷🇴',
    placeholder: '712 345 678',
    sampleNumber: '712345678',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^7\d{8}$/,
    defaultCity: 'Bukarest',
    defaultZip: '010011',
    currency: 'RON',
  },
  {
    code: 'LU',
    name: 'Luxembourg',
    name_de: 'Luxemburg',
    dialCode: '+352',
    flag: '🇱🇺',
    placeholder: '621 123 456',
    sampleNumber: '621123456',
    minLength: 9,
    maxLength: 9,
    mobilePattern: /^6\d{8}$/,
    defaultCity: 'Luxemburg',
    defaultZip: 'L-1111',
    currency: 'EUR',
  },
];

export interface ValidationResult {
  isValid: boolean;
  cleanDigits: string;
  formattedInternational: string;
  country: EuropeanCountry;
  error?: string;
}

/**
 * Validates a European phone number for WhatsApp usage.
 */
export function validateEuropeanPhone(
  rawInput: string,
  countryCode: string = 'DE'
): ValidationResult {
  const country =
    EUROPEAN_COUNTRIES.find((c) => c.code.toUpperCase() === countryCode.toUpperCase()) ||
    EUROPEAN_COUNTRIES[0];

  // Strip all non-digit characters
  let digits = rawInput.replace(/\D/g, '');

  // Strip international dial prefix if user typed it (e.g. 0049 or 49)
  const dialDigits = country.dialCode.replace(/\D/g, '');
  if (digits.startsWith('00' + dialDigits)) {
    digits = digits.slice(('00' + dialDigits).length);
  } else if (digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  // Remove leading single zero (common national trunk prefix in DE, UK, FR, etc.)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Length checks
  if (digits.length === 0) {
    return {
      isValid: false,
      cleanDigits: '',
      formattedInternational: `${country.dialCode} `,
      country,
      error: `Please enter a valid ${country.name} WhatsApp phone number.`,
    };
  }

  if (digits.length < country.minLength) {
    return {
      isValid: false,
      cleanDigits: digits,
      formattedInternational: `${country.dialCode} ${digits}`,
      country,
      error: `Number too short for ${country.name} (needs ${country.minLength} digits without country code).`,
    };
  }

  if (digits.length > country.maxLength) {
    return {
      isValid: false,
      cleanDigits: digits,
      formattedInternational: `${country.dialCode} ${digits}`,
      country,
      error: `Number exceeds maximum length for ${country.name} (${country.maxLength} digits).`,
    };
  }

  // Check mobile pattern if applicable
  const matchesMobile = country.mobilePattern.test(digits);
  if (!matchesMobile) {
    return {
      isValid: false,
      cleanDigits: digits,
      formattedInternational: `${country.dialCode} ${digits}`,
      country,
      error: `Not a standard European mobile / WhatsApp prefix for ${country.name}.`,
    };
  }

  return {
    isValid: true,
    cleanDigits: digits,
    formattedInternational: `${country.dialCode} ${digits}`,
    country,
  };
}

export function formatEuropeanDisplay(digits: string, country: EuropeanCountry): string {
  if (!digits) return '';
  return `${country.dialCode} ${digits}`;
}
