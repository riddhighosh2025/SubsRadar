import React, { useState } from 'react';
import {
  BillingCycle,
  SUBSCRIPTION_CATEGORIES,
  SubscriptionCategory,
  WORLD_CURRENCIES,
  formatCurrency,
  getCurrencySymbol,
} from '../types/subscription.ts';
import { ComputedThemeStyles, ThemeConfig } from '../types/theme.ts';
import { SubsRadarLogo } from './SubsRadarLogo.tsx';
import { ThemeControlBar } from './ThemeControlBar.tsx';
import {
  ArrowLeft,
  ArrowRight,
  Coins,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';

export interface ManualSubscriptionEntry {
  name: string;
  category: SubscriptionCategory;
  monthlyCost: string;
  billingCycle: BillingCycle;
  usageFrequency: number;
}

interface FinancialOnboardingPageProps {
  userName: string;
  initialCurrency: string;
  initialEarnings: number;
  initialExpenditure: number;
  initialSavingGoal: number;
  themeConfig: ThemeConfig;
  styles: ComputedThemeStyles;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onChangeTheme: (updates: Partial<ThemeConfig>) => void;
  onBack: () => void;
  onCompleteOnboarding: (payload: {
    currency: string;
    totalEarnings: number;
    monthlyExpenditure: number;
    monthlySavingGoal: number;
    manualSubscriptions: ManualSubscriptionEntry[];
  }) => Promise<void>;
}

export const FinancialOnboardingPage: React.FC<FinancialOnboardingPageProps> = ({
  userName,
  initialCurrency,
  initialEarnings,
  initialExpenditure,
  initialSavingGoal,
  themeConfig,
  styles,
  zoomLevel,
  onZoomChange,
  onChangeTheme,
  onBack,
  onCompleteOnboarding,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    initialCurrency || 'USD'
  );
  const [customCurrencyInput, setCustomCurrencyInput] = useState<string>('');
  const [totalEarnings, setTotalEarnings] = useState<string>(
    String(initialEarnings || 9200)
  );
  const [monthlyExpenditure, setMonthlyExpenditure] = useState<string>(
    String(initialExpenditure || 4350)
  );
  const [monthlySavingGoal, setMonthlySavingGoal] = useState<string>(
    String(initialSavingGoal || 2200)
  );

  const [manualSubs, setManualSubs] = useState<ManualSubscriptionEntry[]>([
    {
      name: 'Netflix 4K Ultra',
      category: 'ENTERTAINMENT',
      monthlyCost: '22.99',
      billingCycle: 'MONTHLY',
      usageFrequency: 18,
    },
  ]);

  const [newSubName, setNewSubName] = useState('');
  const [newSubCat, setNewSubCat] = useState<SubscriptionCategory>('SaaS');
  const [newSubCost, setNewSubCost] = useState('29.99');
  const [newSubCycle, setNewSubCycle] = useState<BillingCycle>('MONTHLY');
  const [newSubUsage, setNewSubUsage] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  const activeCurrency = customCurrencyInput.trim() || selectedCurrency || 'USD';
  const currencySym = getCurrencySymbol(activeCurrency);

  const handleAddSub = () => {
    if (!newSubName.trim()) return;
    setManualSubs((prev) => [
      ...prev,
      {
        name: newSubName.trim(),
        category: newSubCat,
        monthlyCost: newSubCost || '15.00',
        billingCycle: newSubCycle,
        usageFrequency: newSubUsage,
      },
    ]);
    setNewSubName('');
    setNewSubCost('19.99');
  };

  const handleRemoveSub = (idx: number) => {
    setManualSubs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onCompleteOnboarding({
        currency: activeCurrency,
        totalEarnings: parseFloat(totalEarnings) || 0,
        monthlyExpenditure: parseFloat(monthlyExpenditure) || 0,
        monthlySavingGoal: parseFloat(monthlySavingGoal) || 0,
        manualSubscriptions: manualSubs,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${styles.subPanelClass}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go Back
        </button>

        <SubsRadarLogo
          accentHex={styles.accentHex}
          headingFontClass={styles.headingFontClass}
          size="sm"
        />
      </div>

      <ThemeControlBar
        themeConfig={themeConfig}
        styles={styles}
        onChangeTheme={onChangeTheme}
        zoomLevel={zoomLevel}
        onZoomChange={onZoomChange}
      />

      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className={`${styles.cardClass} p-6 sm:p-8 space-y-6 text-xs`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4 border-current/10">
            <div className="flex items-center gap-2.5">
              <Wallet className="w-5 h-5" style={{ color: styles.accentHex }} />
              <h1 className={`text-2xl font-bold ${styles.headingFontClass}`}>
                Financial Profile, Currency &amp; Subscriptions Setup — {userName}
              </h1>
            </div>
            <span
              className="font-mono text-xs font-bold px-2.5 py-1 rounded-md"
              style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
            >
              Active Unit: {activeCurrency} ({currencySym.trim()})
            </span>
          </div>

          {/* 01. Unit of Currency Selection (All Currencies Viable) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4" style={{ color: styles.accentHex }} />
              <h2 className={`text-base font-bold ${styles.headingFontClass}`}>
                01. Select Unit of Currency (All Currencies Supported)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">
                  World &amp; Digital Currencies
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => {
                    setSelectedCurrency(e.target.value);
                    setCustomCurrencyInput('');
                  }}
                  className={`w-full px-3 py-2 border font-mono ${styles.inputClass} focus:outline-none`}
                >
                  {WORLD_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol.trim()}) — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Or Type Any Custom Currency Code / Symbol
                </label>
                <input
                  type="text"
                  value={customCurrencyInput}
                  onChange={(e) => setCustomCurrencyInput(e.target.value)}
                  placeholder="e.g., ₹, €, £, CHF, KSh, AED, ₿, or any unit..."
                  className={`w-full px-3 py-2 border font-mono ${styles.inputClass} focus:outline-none`}
                />
              </div>
            </div>

            {/* Quick Currency Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD', 'CHF', 'KRW', 'BRL'].map(
                (code) => {
                  const active = activeCurrency.toUpperCase() === code;
                  const sym = getCurrencySymbol(code).trim();
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setSelectedCurrency(code);
                        setCustomCurrencyInput('');
                      }}
                      style={
                        active
                          ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                          : undefined
                      }
                      className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold cursor-pointer transition-colors ${
                        active ? '' : styles.subPanelClass
                      }`}
                    >
                      {code} ({sym})
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* 02. Monthly Earnings, Expenditure & Saving Goals */}
          <div className="space-y-3 pt-3 border-t border-current/10">
            <h2 className={`text-base font-bold ${styles.headingFontClass}`}>
              02. Total Earnings, Monthly Expenditure &amp; Monthly Saving Goals ({currencySym.trim()})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1">
                  Total Monthly Earnings ({currencySym.trim()}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={totalEarnings}
                  onChange={(e) => setTotalEarnings(e.target.value)}
                  className={`w-full px-3 py-2 font-mono tabular-nums border ${styles.inputClass}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Monthly Expenditure ({currencySym.trim()}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={monthlyExpenditure}
                  onChange={(e) => setMonthlyExpenditure(e.target.value)}
                  className={`w-full px-3 py-2 font-mono tabular-nums border ${styles.inputClass}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Monthly Saving Goal ({currencySym.trim()}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={monthlySavingGoal}
                  onChange={(e) => setMonthlySavingGoal(e.target.value)}
                  className={`w-full px-3 py-2 font-mono tabular-nums border ${styles.inputClass}`}
                />
              </div>
            </div>
          </div>

          {/* 03. Manually Add Subscriptions */}
          <div className="space-y-3 pt-3 border-t border-current/10">
            <h2 className={`text-base font-bold ${styles.headingFontClass}`}>
              03. Manually Add Your Subscriptions ({currencySym.trim()})
            </h2>

            <div className={`${styles.subPanelClass} p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end`}>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold mb-1">Service Name</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g., Spotify, Gym"
                  className={`w-full px-2.5 py-1.5 border ${styles.inputClass}`}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold mb-1">Category</label>
                <select
                  value={newSubCat}
                  onChange={(e) => setNewSubCat(e.target.value as SubscriptionCategory)}
                  className={`w-full px-2.5 py-1.5 border ${styles.inputClass}`}
                >
                  {SUBSCRIPTION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold mb-1">
                  Cost ({currencySym.trim()})
                </label>
                <input
                  type="number"
                  step="any"
                  value={newSubCost}
                  onChange={(e) => setNewSubCost(e.target.value)}
                  className={`w-full px-2.5 py-1.5 font-mono border ${styles.inputClass}`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold mb-1">Cycle</label>
                <select
                  value={newSubCycle}
                  onChange={(e) => setNewSubCycle(e.target.value as BillingCycle)}
                  className={`w-full px-2.5 py-1.5 border ${styles.inputClass}`}
                >
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="ANNUAL">ANNUAL</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold mb-1">Days</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={newSubUsage}
                  onChange={(e) => setNewSubUsage(Number(e.target.value))}
                  className={`w-full px-2 py-1.5 font-mono border ${styles.inputClass}`}
                />
              </div>
              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddSub}
                  style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                  className="w-full py-1.5 px-2 rounded-md font-semibold flex items-center justify-center cursor-pointer"
                  title="Add Subscription"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {manualSubs.length > 0 && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {manualSubs.map((item, idx) => (
                  <div
                    key={idx}
                    className={`${styles.subPanelClass} px-3.5 py-2 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px]">{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px]">{item.billingCycle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px]">
                        {item.usageFrequency}d/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold">
                        {formatCurrency(parseFloat(item.monthlyCost || '0'), activeCurrency)}/mo
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSub(idx)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
              className="w-full py-3 px-6 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {isSaving
                  ? 'Saving Financial Profile & Subscriptions...'
                  : `Save & Launch Workspace in ${activeCurrency}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
