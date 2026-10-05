import React, { useState } from 'react';
import {
  UserFinancialProfile,
  WORLD_CURRENCIES,
  formatCurrency,
  getCurrencySymbol,
} from '../types/subscription.ts';
import { ComputedThemeStyles } from '../types/theme.ts';
import { Check, Coins, Edit3, Target, Wallet } from 'lucide-react';

interface FinancialProfileBarProps {
  userName: string;
  profile: UserFinancialProfile;
  activeSubscriptionBurn: number;
  styles: ComputedThemeStyles;
  onSaveProfile: (updates: Partial<UserFinancialProfile>) => Promise<void>;
  onOpenFullOnboarding?: () => void;
}

export const FinancialProfileBar: React.FC<FinancialProfileBarProps> = ({
  userName,
  profile,
  activeSubscriptionBurn,
  styles,
  onSaveProfile,
  onOpenFullOnboarding,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currencyInput, setCurrencyInput] = useState(profile.currency || 'USD');
  const [customCurrencyInput, setCustomCurrencyInput] = useState('');
  const [earningsInput, setEarningsInput] = useState(String(profile.totalEarnings));
  const [expenditureInput, setExpenditureInput] = useState(
    String(profile.monthlyExpenditure)
  );
  const [goalInput, setGoalInput] = useState(String(profile.monthlySavingGoal));
  const [savedToast, setSavedToast] = useState(false);

  const activeCurrency = profile.currency || 'USD';
  const currencySym = getCurrencySymbol(activeCurrency);

  const totalCombinedOutflow = profile.monthlyExpenditure + activeSubscriptionBurn;
  const currentMonthlySavings = Math.max(0, profile.totalEarnings - totalCombinedOutflow);
  const goalProgressPct =
    profile.monthlySavingGoal > 0
      ? Math.min(100, (currentMonthlySavings / profile.monthlySavingGoal) * 100)
      : 100;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenCurrency = customCurrencyInput.trim() || currencyInput.trim() || 'USD';
    await onSaveProfile({
      currency: chosenCurrency,
      totalEarnings: parseFloat(earningsInput) || 0,
      monthlyExpenditure: parseFloat(expenditureInput) || 0,
      monthlySavingGoal: parseFloat(goalInput) || 0,
    });
    setIsEditing(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <section className={`${styles.cardClass} p-4 transition-colors duration-200`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-current/10">
        <div className="flex flex-wrap items-center gap-2.5">
          <Wallet className="w-4 h-4" style={{ color: styles.accentHex }} />
          <h2 className={`text-lg font-bold ${styles.headingFontClass}`}>
            Personal Financial Targets — {userName}
          </h2>
          <span
            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
          >
            {activeCurrency} ({currencySym.trim()})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedToast && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}

          {/* Quick Inline Currency Switcher */}
          <div className="flex items-center gap-1 text-xs">
            <Coins className="w-3.5 h-3.5" style={{ color: styles.accentHex }} />
            <select
              value={
                WORLD_CURRENCIES.some(
                  (c) => c.code.toUpperCase() === activeCurrency.toUpperCase()
                )
                  ? activeCurrency.toUpperCase()
                  : 'CUSTOM'
              }
              onChange={(e) => {
                if (e.target.value === 'CUSTOM') {
                  setIsEditing(true);
                } else {
                  onSaveProfile({ currency: e.target.value });
                }
              }}
              aria-label="Select Currency Unit"
              className={`px-2 py-1 text-xs font-mono font-semibold border ${styles.inputClass} cursor-pointer focus:outline-none`}
            >
              {WORLD_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol.trim()})
                </option>
              ))}
              <option value="CUSTOM">+ Any Custom Currency...</option>
            </select>
          </div>

          {onOpenFullOnboarding && (
            <button
              type="button"
              onClick={onOpenFullOnboarding}
              className={`px-3 py-1 text-xs font-semibold ${styles.subPanelClass} cursor-pointer whitespace-nowrap`}
            >
              Setup Wizard
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setCurrencyInput(profile.currency || 'USD');
              setCustomCurrencyInput('');
              setEarningsInput(String(profile.totalEarnings));
              setExpenditureInput(String(profile.monthlyExpenditure));
              setGoalInput(String(profile.monthlySavingGoal));
              setIsEditing((prev) => !prev);
            }}
            className={`px-3 py-1 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${styles.subPanelClass}`}
          >
            <Edit3 className="w-3.5 h-3.5" style={{ color: styles.accentHex }} />
            {isEditing ? 'Cancel' : 'Edit Targets & Currency'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="pt-3 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end text-xs"
        >
          <div>
            <label className="block font-semibold mb-1">Currency Unit</label>
            <select
              value={currencyInput}
              onChange={(e) => {
                setCurrencyInput(e.target.value);
                setCustomCurrencyInput('');
              }}
              className={`w-full px-2.5 py-1.5 font-mono border ${styles.inputClass}`}
            >
              {WORLD_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol.trim()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Custom Currency</label>
            <input
              type="text"
              value={customCurrencyInput}
              onChange={(e) => setCustomCurrencyInput(e.target.value)}
              placeholder="Any code/symbol..."
              className={`w-full px-2.5 py-1.5 font-mono border ${styles.inputClass}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Total Earnings ({currencySym.trim()})
            </label>
            <input
              type="number"
              step="any"
              value={earningsInput}
              onChange={(e) => setEarningsInput(e.target.value)}
              className={`w-full px-3 py-1.5 font-mono tabular-nums border ${styles.inputClass}`}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Monthly Expenditure ({currencySym.trim()})
            </label>
            <input
              type="number"
              step="any"
              value={expenditureInput}
              onChange={(e) => setExpenditureInput(e.target.value)}
              className={`w-full px-3 py-1.5 font-mono tabular-nums border ${styles.inputClass}`}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Saving Goal ({currencySym.trim()})
            </label>
            <input
              type="number"
              step="any"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className={`w-full px-3 py-1.5 font-mono tabular-nums border ${styles.inputClass}`}
            />
          </div>
          <div>
            <button
              type="submit"
              style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
              className="w-full py-1.5 px-4 rounded-lg font-semibold cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x ${styles.dividerClass} pt-3`}>
          <div className="pr-4 py-1.5 sm:py-0">
            <div className={`text-xs ${styles.mutedTextClass}`}>
              Total Monthly Earnings
            </div>
            <div className="mt-0.5 text-xl font-bold font-mono tabular-nums">
              {formatCurrency(profile.totalEarnings, activeCurrency)}
              <span className={`text-xs font-normal ${styles.mutedTextClass}`}>/mo</span>
            </div>
          </div>

          <div className="sm:px-4 py-1.5 sm:py-0">
            <div className={`text-xs ${styles.mutedTextClass}`}>
              Monthly Expenditure + Subs
            </div>
            <div className="mt-0.5 text-xl font-bold font-mono tabular-nums">
              {formatCurrency(totalCombinedOutflow, activeCurrency)}
              <span className={`text-xs font-normal ${styles.mutedTextClass}`}>/mo</span>
            </div>
          </div>

          <div className="sm:px-4 py-1.5 sm:py-0">
            <div className={`text-xs ${styles.mutedTextClass}`}>
              Monthly Saving Goal
            </div>
            <div
              className="mt-0.5 text-xl font-bold font-mono tabular-nums"
              style={{ color: styles.accentHex }}
            >
              {formatCurrency(profile.monthlySavingGoal, activeCurrency)}
              <span className={`text-xs font-normal ${styles.mutedTextClass}`}>/mo</span>
            </div>
          </div>

          <div className="sm:pl-4 py-1.5 sm:py-0">
            <div className="flex items-center justify-between text-xs">
              <span className={`${styles.mutedTextClass} flex items-center gap-1`}>
                <Target className="w-3.5 h-3.5" style={{ color: styles.accentHex }} />
                Goal Attainment
              </span>
              <span className="font-mono font-bold tabular-nums">
                {goalProgressPct.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-500/15 rounded-full overflow-hidden mt-2">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${goalProgressPct}%`,
                  backgroundColor: styles.accentHex,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
