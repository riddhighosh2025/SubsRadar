export type BillingCycle = 'MONTHLY' | 'ANNUAL' | 'CUSTOM';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELING' | 'CANCELED';

export type SubscriptionCategory =
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'SaaS'
  | 'FINANCE'
  | 'HEALTH'
  | 'OTHER';

export const SUBSCRIPTION_CATEGORIES: SubscriptionCategory[] = [
  'ENTERTAINMENT',
  'UTILITIES',
  'SaaS',
  'FINANCE',
  'HEALTH',
  'OTHER',
];

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const WORLD_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: 'QAR ', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'KD ', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'BD ', name: 'Bahraini Dinar' },
  { code: 'OMR', symbol: 'OMR ', name: 'Omani Rial' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
  { code: 'SEK', symbol: 'kr ', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr ', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr ', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč ', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft ', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei ', name: 'Romanian Leu' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'ARS', symbol: 'ARS$', name: 'Argentine Peso' },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso' },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh ', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'MAD', symbol: 'MAD ', name: 'Moroccan Dirham' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp ', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'LKR', symbol: 'Rs ', name: 'Sri Lankan Rupee' },
  { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee' },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin' },
  { code: 'ETH', symbol: 'Ξ', name: 'Ethereum' },
  { code: 'USDT', symbol: '₮', name: 'Tether USD' },
];

export function getCurrencySymbol(unit?: string): string {
  if (!unit || !unit.trim()) return '$';
  const raw = unit.trim();
  const upper = raw.toUpperCase();
  const found = WORLD_CURRENCIES.find(
    (c) => c.code.toUpperCase() === upper || c.symbol.trim().toUpperCase() === upper
  );
  if (found) return found.symbol;
  // Support any custom unit of currency entered by the user
  return /^[A-Za-z]{2,6}$/.test(raw) ? `${raw} ` : raw;
}

export function formatCurrency(
  amount: number,
  unit?: string,
  decimals = 2
): string {
  const sym = getCurrencySymbol(unit);
  const safeNum = Number.isFinite(amount) ? amount : 0;
  return `${sym}${safeNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export const CATEGORY_CONFIG: Record<
  SubscriptionCategory,
  {
    label: string;
    colorHex: string;
    bgHex: string;
    shape: 'circle' | 'diamond' | 'square' | 'triangle' | 'Cross' | 'star';
    shortCode: string;
  }
> = {
  ENTERTAINMENT: {
    label: 'Entertainment',
    colorHex: '#7C3AED',
    bgHex: '#F5F3FF',
    shape: 'circle',
    shortCode: 'ENT',
  },
  UTILITIES: {
    label: 'Utilities & Cloud',
    colorHex: '#0284C7',
    bgHex: '#F0F9FF',
    shape: 'square',
    shortCode: 'UTL',
  },
  SaaS: {
    label: 'SaaS & Productivity',
    colorHex: '#2563EB',
    bgHex: '#EFF6FF',
    shape: 'diamond',
    shortCode: 'SAS',
  },
  FINANCE: {
    label: 'Finance & Legal',
    colorHex: '#059669',
    bgHex: '#ECFDF5',
    shape: 'triangle',
    shortCode: 'FIN',
  },
  HEALTH: {
    label: 'Health & Fitness',
    colorHex: '#E11D48',
    bgHex: '#FFF1F2',
    shape: 'Cross',
    shortCode: 'HLT',
  },
  OTHER: {
    label: 'Other / Custom',
    colorHex: '#D97706',
    bgHex: '#FFFBEB',
    shape: 'star',
    shortCode: 'OTH',
  },
};

export function normalizeCategoryEnum(raw?: string): SubscriptionCategory {
  if (!raw) return 'SaaS';
  const upper = raw.trim().toUpperCase();
  if (upper === 'ENTERTAINMENT' || upper.includes('MEDIA') || upper.includes('STREAM')) {
    return 'ENTERTAINMENT';
  }
  if (
    upper === 'UTILITIES' ||
    upper.includes('CLOUD') ||
    upper.includes('DEV') ||
    upper.includes('STORAGE')
  ) {
    return 'UTILITIES';
  }
  if (upper === 'SAAS' || upper.includes('PRODUCTIVITY') || upper.includes('SOFTWARE')) {
    return 'SaaS';
  }
  if (upper === 'FINANCE' || upper.includes('BANK') || upper.includes('TAX')) {
    return 'FINANCE';
  }
  if (
    upper === 'HEALTH' ||
    upper.includes('FITNESS') ||
    upper.includes('GYM') ||
    upper.includes('WELLNESS')
  ) {
    return 'HEALTH';
  }
  if (upper === 'OTHER') {
    return 'OTHER';
  }
  return 'OTHER';
}

export function getCategoryDisplayLabel(sub: {
  category: SubscriptionCategory;
  customCategory?: string;
}): string {
  if (sub.customCategory && sub.customCategory.trim()) {
    return `${CATEGORY_CONFIG[sub.category]?.label || sub.category} (${sub.customCategory.trim()})`;
  }
  return CATEGORY_CONFIG[sub.category]?.label || sub.category;
}

export type QuadrantId = 'DANGER_ZONE' | 'HIGH_VALUE' | 'SILENT_LEAKS' | 'BARGAIN';

export interface HistoricalBurnPoint {
  month: string;
  subscriptionBurn: number;
  targetBurn: number;
}

export interface UserFinancialProfile {
  currency: string; // Any viable currency code or symbol (e.g. 'USD', 'INR', 'EUR', '£', 'CHF', etc.)
  totalEarnings: number;
  monthlyExpenditure: number;
  monthlySavingGoal: number;
  historicalBurn: HistoricalBurnPoint[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  createdAt: string;
  financialProfile?: UserFinancialProfile;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  category: SubscriptionCategory;
  customCategory?: string;
  monthlyCost: number;
  billingCycle: BillingCycle;
  renewalDate: string;
  usageFrequency: number;
  status: SubscriptionStatus;
  cancellationUrl?: string;
}

export interface SavedScenario {
  id: string;
  userId: string;
  name: string;
  targetSavings: number;
  canceledSubscriptionIds: string[];
  annualROI: number;
  createdAt: string;
}

export interface ParsedStatementItem {
  name: string;
  cost: number;
  category: SubscriptionCategory;
  customCategory?: string;
  estimatedCycle: BillingCycle;
  rawLine?: string;
  suggestedUsageFrequency?: number;
  cancellationUrl?: string;
}

export type CancellationTone = 'Firm & Direct' | 'Polite & Brief' | 'Negotiate Discount';

export type CancellationReason =
  | 'Too expensive'
  | "Don't use it"
  | 'Found alternative'
  | 'Unexplained price hike';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface CancellationScriptRequest {
  subscriptionName: string;
  monthlyCost: number;
  currency?: string;
  userReason: CancellationReason | string;
  preferredTone: CancellationTone | string;
  category?: SubscriptionCategory | string;
  customCategory?: string;
  billingCycle?: BillingCycle;
  renewalDate?: string;
  inferenceMode?: 'cloud' | 'ollama';
}

export interface CancellationScriptResponse {
  subject: string;
  body: string;
  darkPatternAdvice: string;
  cancellationScheduleNote?: string;
  providerUsed?: string;
  groundingSources?: GroundingSource[];
}

export interface SearchPricingResult {
  subscriptionName: string;
  summary: string;
  sources: GroundingSource[];
}

export const COST_THRESHOLD = 45;
export const USAGE_THRESHOLD = 12;

export function getQuadrant(
  monthlyCost: number,
  usageFrequency: number,
  costCutoff = COST_THRESHOLD,
  usageCutoff = USAGE_THRESHOLD
): {
  id: QuadrantId;
  label: string;
  shortDesc: string;
  colorHex: string;
  bgHex: string;
  borderHex: string;
} {
  if (monthlyCost >= costCutoff && usageFrequency < usageCutoff) {
    return {
      id: 'DANGER_ZONE',
      label: 'Danger Zone',
      shortDesc: 'High Cost · Low Usage',
      colorHex: '#DC2626',
      bgHex: '#FEF2F2',
      borderHex: '#FECACA',
    };
  }
  if (monthlyCost >= costCutoff && usageFrequency >= usageCutoff) {
    return {
      id: 'HIGH_VALUE',
      label: 'High Value',
      shortDesc: 'High Cost · High Usage',
      colorHex: '#16A34A',
      bgHex: '#F0FDF4',
      borderHex: '#BBF7D0',
    };
  }
  if (monthlyCost < costCutoff && usageFrequency < usageCutoff) {
    return {
      id: 'SILENT_LEAKS',
      label: 'Silent Leaks',
      shortDesc: 'Low Cost · Low Usage',
      colorHex: '#D97706',
      bgHex: '#FFFBEB',
      borderHex: '#FDE68A',
    };
  }
  return {
    id: 'BARGAIN',
    label: 'Bargain',
    shortDesc: 'Low Cost · High Usage',
    colorHex: '#2563EB',
    bgHex: '#EFF6FF',
    borderHex: '#BFDBFE',
  };
}
