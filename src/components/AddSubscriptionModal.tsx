import React, { useState } from 'react';
import {
  BillingCycle,
  CATEGORY_CONFIG,
  SUBSCRIPTION_CATEGORIES,
  SubscriptionCategory,
  SubscriptionStatus,
  getCurrencySymbol,
} from '../types/subscription.ts';
import { ComputedThemeStyles } from '../types/theme.ts';
import { Plus, X } from 'lucide-react';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  customCategories: string[];
  currency: string;
  styles: ComputedThemeStyles;
  onClose: () => void;
  onCreateCustomCategory: (name: string) => Promise<void>;
  onCreate: (input: {
    name: string;
    category: SubscriptionCategory;
    customCategory?: string;
    monthlyCost: number;
    billingCycle: BillingCycle;
    renewalDate: string;
    usageFrequency: number;
    status: SubscriptionStatus;
    cancellationUrl?: string;
  }) => Promise<void>;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  isOpen,
  customCategories,
  currency,
  styles,
  onClose,
  onCreateCustomCategory,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SubscriptionCategory>('SaaS');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [newCustomInput, setNewCustomInput] = useState('');

  const [monthlyCost, setMonthlyCost] = useState('29.99');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [usageFrequency, setUsageFrequency] = useState(8);
  const [renewalDate, setRenewalDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [cancellationUrl, setCancellationUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currencySym = getCurrencySymbol(currency).trim();

  const handleAddCustomCategory = async () => {
    const clean = newCustomInput.trim();
    if (!clean) return;
    await onCreateCustomCategory(clean);
    setCustomCategory(clean);
    setNewCustomInput('');
    setIsCreatingCustom(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        category,
        customCategory: customCategory.trim() || undefined,
        monthlyCost: parseFloat(monthlyCost) || 0,
        billingCycle,
        renewalDate: new Date(renewalDate).toISOString(),
        usageFrequency,
        status: 'ACTIVE',
        cancellationUrl: cancellationUrl.trim() || undefined,
      });
      setName('');
      setMonthlyCost('29.99');
      setCancellationUrl('');
      setCustomCategory('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`max-w-lg w-full ${styles.cardClass} overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${styles.dividerClass} flex items-center justify-between`}>
          <div>
            <h2 className={`text-base font-bold ${styles.headingFontClass}`}>
              Manually Log Recurring Subscription ({currency})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 ${styles.mutedTextClass} hover:opacity-100 rounded-md cursor-pointer`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Service Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Midjourney Pro, Whoop 4.0, QuickBooks"
              className={`w-full px-3 py-2 border ${styles.inputClass} focus:outline-none`}
            />
          </div>

          {/* Category Enum + Custom Category Selector */}
          <div className={`space-y-2 p-3.5 ${styles.subPanelClass}`}>
            <div className="flex items-center justify-between">
              <label className="font-semibold">Category *</label>
              <button
                type="button"
                onClick={() => setIsCreatingCustom((prev) => !prev)}
                style={{ color: styles.accentHex }}
                className="text-xs font-semibold underline cursor-pointer"
              >
                {isCreatingCustom ? 'Cancel Custom' : '+ Create Custom Category'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {SUBSCRIPTION_CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={
                      active
                        ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                        : undefined
                    }
                    className={`py-2 px-2.5 rounded-md font-mono text-[11px] font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                      active ? 'border-transparent' : `${styles.inputClass} hover:opacity-85`
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: active ? '#FFFFFF' : cfg.colorHex }}
                    />
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <label className={`block text-[11px] ${styles.mutedTextClass} mb-1`}>
                Optional Custom Category Sub-Label
              </label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className={`w-full px-3 py-1.5 border ${styles.inputClass} text-xs focus:outline-none`}
              >
                <option value="">None (Use Standard Category Only)</option>
                {customCategories.map((cc) => (
                  <option key={cc} value={cc}>
                    {cc}
                  </option>
                ))}
              </select>
            </div>

            {isCreatingCustom && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newCustomInput}
                  onChange={(e) => setNewCustomInput(e.target.value)}
                  placeholder="Enter new custom category name..."
                  className={`flex-1 px-2.5 py-1.5 border ${styles.inputClass} text-xs focus:outline-none`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                  className="px-3 py-1.5 font-semibold rounded-md cursor-pointer whitespace-nowrap"
                >
                  Create &amp; Select
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">
                Monthly Cost ({currencySym} {currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={monthlyCost}
                onChange={(e) => setMonthlyCost(e.target.value)}
                className={`w-full px-3 py-2 font-mono tabular-nums border ${styles.inputClass} focus:outline-none`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className={`w-full px-3 py-2 border ${styles.inputClass} focus:outline-none`}
              >
                <option value="MONTHLY">MONTHLY</option>
                <option value="ANNUAL">ANNUAL</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Next Renewal Date</label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className={`w-full px-3 py-2 font-mono border ${styles.inputClass} focus:outline-none`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold">
                Usage Frequency (Days / Month)
              </label>
              <span className="font-mono font-semibold">{usageFrequency} days/mo</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={usageFrequency}
              onChange={(e) => setUsageFrequency(Number(e.target.value))}
              className="w-full accent-current cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Cancellation Portal URL (Optional)
            </label>
            <input
              type="url"
              value={cancellationUrl}
              onChange={(e) => setCancellationUrl(e.target.value)}
              placeholder="https://..."
              className={`w-full px-3 py-2 border ${styles.inputClass} focus:outline-none`}
            />
          </div>

          <div className={`pt-3 border-t ${styles.dividerClass} flex items-center justify-end gap-2`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium ${styles.mutedTextClass} hover:opacity-100 cursor-pointer`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
              className="px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              {isSubmitting ? 'Saving...' : 'Add to Matrix'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
