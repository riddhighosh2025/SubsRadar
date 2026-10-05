import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  CATEGORY_CONFIG,
  COST_THRESHOLD,
  QuadrantId,
  SUBSCRIPTION_CATEGORIES,
  SearchPricingResult,
  Subscription,
  SubscriptionCategory,
  SubscriptionStatus,
  USAGE_THRESHOLD,
  formatCurrency,
  getCategoryDisplayLabel,
  getCurrencySymbol,
  getQuadrant,
} from '../types/subscription.ts';
import { ComputedThemeStyles } from '../types/theme.ts';
import {
  ArrowLeft,
  ArrowUpRight,
  FileWarning,
  Globe,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface CostVsUsageMatrixProps {
  subscriptions: Subscription[];
  customCategories: string[];
  selectedSubId: string | null;
  currency: string;
  styles: ComputedThemeStyles;
  onBack?: () => void;
  onSelectSub: (sub: Subscription | null) => void;
  onUpdateSub: (id: string, updates: Partial<Subscription>) => Promise<void>;
  onDeleteSub: (id: string) => Promise<void>;
  onCreateCustomCategory: (name: string) => Promise<void>;
  onOpenAiModal: (sub: Subscription) => void;
  onSimulateCut: (subId: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Subscription }>;
  currency: string;
}

const MatrixTooltip: React.FC<CustomTooltipProps> = ({ active, payload, currency }) => {
  if (!active || !payload || !payload.length) return null;
  const sub = payload[0].payload;
  const quad = getQuadrant(sub.monthlyCost, sub.usageFrequency);
  const catMeta = CATEGORY_CONFIG[sub.category] || CATEGORY_CONFIG.OTHER;
  const costPerUse =
    sub.usageFrequency > 0
      ? `${formatCurrency(sub.monthlyCost / sub.usageFrequency, currency)}/day`
      : `${formatCurrency(sub.monthlyCost, currency)} (0 uses)`;

  return (
    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-lg shadow-lg border border-slate-700 text-xs max-w-xs">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="font-semibold text-sm text-white">{sub.name}</span>
        <span
          className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"
          style={{ backgroundColor: catMeta.colorHex, color: '#FFFFFF' }}
        >
          {catMeta.shortCode}
        </span>
      </div>
      <div className="text-slate-300 flex items-center gap-1.5 mb-2">
        <span>{getCategoryDisplayLabel(sub)}</span>
        <span aria-hidden="true">·</span>
        <span>{quad.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono tabular-nums text-xs border-t border-slate-800 pt-2">
        <span className="text-slate-400">Monthly Cost:</span>
        <span className="text-right font-medium text-white">
          {formatCurrency(sub.monthlyCost, currency)}
        </span>
        <span className="text-slate-400">Usage Freq:</span>
        <span className="text-right font-medium text-white">{sub.usageFrequency} days/mo</span>
        <span className="text-slate-400">Effective Cost:</span>
        <span className="text-right font-medium text-amber-300">{costPerUse}</span>
      </div>
    </div>
  );
};

export const CostVsUsageMatrix: React.FC<CostVsUsageMatrixProps> = ({
  subscriptions,
  customCategories,
  selectedSubId,
  currency,
  styles,
  onBack,
  onSelectSub,
  onUpdateSub,
  onDeleteSub,
  onCreateCustomCategory,
  onOpenAiModal,
  onSimulateCut,
}) => {
  const [quadrantFilter, setQuadrantFilter] = useState<'ALL' | QuadrantId>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SubscriptionCategory>('ALL');
  const [showCategoryIntelligence, setShowCategoryIntelligence] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<'CATEGORY' | 'QUADRANT'>('CATEGORY');
  const [costCutoff, setCostCutoff] = useState<number>(COST_THRESHOLD);
  const [usageCutoff, setUsageCutoff] = useState<number>(USAGE_THRESHOLD);
  const [chartZoom, setChartZoom] = useState<number>(1);

  const [isAddingCustomCat, setIsAddingCustomCat] = useState(false);
  const [newCustomCatInput, setNewCustomCatInput] = useState('');

  const [isSearchingPricing, setIsSearchingPricing] = useState(false);
  const [pricingIntel, setPricingIntel] = useState<SearchPricingResult | null>(null);

  const currencySym = getCurrencySymbol(currency);

  const activeSubs = useMemo(
    () => subscriptions.filter((s) => s.status !== 'CANCELED'),
    [subscriptions]
  );

  const totalActiveBurn = useMemo(
    () => activeSubs.reduce((sum, s) => sum + s.monthlyCost, 0),
    [activeSubs]
  );

  const filteredSubs = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchesQuad =
        quadrantFilter === 'ALL' ||
        getQuadrant(s.monthlyCost, s.usageFrequency, costCutoff, usageCutoff).id ===
          quadrantFilter;
      const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
      return matchesQuad && matchesCat;
    });
  }, [subscriptions, quadrantFilter, categoryFilter, costCutoff, usageCutoff]);

  const selectedSub = useMemo(
    () =>
      filteredSubs.find((s) => s.id === selectedSubId) ||
      subscriptions.find((s) => s.id === selectedSubId) ||
      filteredSubs[0] ||
      subscriptions[0] ||
      null,
    [filteredSubs, subscriptions, selectedSubId]
  );

  const baseMaxCost = useMemo(() => {
    const highest = Math.max(...subscriptions.map((s) => s.monthlyCost), 120);
    return Math.ceil((highest + 25) / 20) * 20;
  }, [subscriptions]);

  const zoomedMaxCost = useMemo(
    () => Math.max(40, Math.round(baseMaxCost / chartZoom)),
    [baseMaxCost, chartZoom]
  );

  const zoomedMaxUsage = useMemo(
    () => Math.max(10, Math.min(40, Math.round(30 / chartZoom))),
    [chartZoom]
  );

  const quadrantCounts = useMemo(() => {
    const counts: Record<QuadrantId, { count: number; monthlyTotal: number }> = {
      DANGER_ZONE: { count: 0, monthlyTotal: 0 },
      SILENT_LEAKS: { count: 0, monthlyTotal: 0 },
      HIGH_VALUE: { count: 0, monthlyTotal: 0 },
      BARGAIN: { count: 0, monthlyTotal: 0 },
    };
    for (const s of activeSubs) {
      const q = getQuadrant(s.monthlyCost, s.usageFrequency, costCutoff, usageCutoff);
      counts[q.id].count += 1;
      counts[q.id].monthlyTotal += s.monthlyCost;
    }
    return counts;
  }, [activeSubs, costCutoff, usageCutoff]);

  const categoryIntelligence = useMemo(() => {
    return SUBSCRIPTION_CATEGORIES.map((cat) => {
      const cfg = CATEGORY_CONFIG[cat];
      const subsInCat = subscriptions.filter((s) => s.category === cat);
      const activeInCat = subsInCat.filter((s) => s.status !== 'CANCELED');
      const monthlyBurn = activeInCat.reduce((sum, s) => sum + s.monthlyCost, 0);
      const avgUsage =
        activeInCat.length > 0
          ? activeInCat.reduce((sum, s) => sum + s.usageFrequency, 0) / activeInCat.length
          : 0;
      const sharePct = totalActiveBurn > 0 ? (monthlyBurn / totalActiveBurn) * 100 : 0;

      return {
        category: cat,
        label: cfg.label,
        colorHex: cfg.colorHex,
        shortCode: cfg.shortCode,
        totalCount: subsInCat.length,
        activeCount: activeInCat.length,
        monthlyBurn,
        avgUsage,
        sharePct,
        items: subsInCat,
      };
    });
  }, [subscriptions, totalActiveBurn]);

  const handleSelectCategory = (cat: 'ALL' | SubscriptionCategory) => {
    const nextCat = categoryFilter === cat && cat !== 'ALL' ? 'ALL' : cat;
    setCategoryFilter(nextCat);
    setShowCategoryIntelligence(true);
    if (nextCat !== 'ALL') {
      const firstMatch = subscriptions.find((s) => s.category === nextCat);
      if (firstMatch) onSelectSub(firstMatch);
    }
  };

  const handleSelectQuadrant = (quad: 'ALL' | QuadrantId) => {
    const nextQuad = quadrantFilter === quad && quad !== 'ALL' ? 'ALL' : quad;
    setQuadrantFilter(nextQuad);
    if (nextQuad !== 'ALL') {
      const firstMatch = subscriptions.find(
        (s) =>
          getQuadrant(s.monthlyCost, s.usageFrequency, costCutoff, usageCutoff).id ===
          nextQuad
      );
      if (firstMatch) onSelectSub(firstMatch);
    }
  };

  const getDotColor = (sub: Subscription) => {
    if (sub.status === 'CANCELED') return '#94A3B8';
    if (colorMode === 'CATEGORY') {
      return CATEGORY_CONFIG[sub.category]?.colorHex || styles.accentHex;
    }
    if (sub.status === 'CANCELING') return '#F59E0B';
    const q = getQuadrant(sub.monthlyCost, sub.usageFrequency, costCutoff, usageCutoff);
    return q.colorHex;
  };

  const handleSaveCustomCategoryForSelected = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !newCustomCatInput.trim()) return;
    const clean = newCustomCatInput.trim();
    await onCreateCustomCategory(clean);
    await onUpdateSub(selectedSub.id, {
      category: 'OTHER',
      customCategory: clean,
    });
    setNewCustomCatInput('');
    setIsAddingCustomCat(false);
  };

  const handleCheckLivePricingWithGoogle = async (sub: Subscription) => {
    setIsSearchingPricing(true);
    setPricingIntel(null);
    try {
      const res = await fetch('/api/ai/search-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionName: sub.name,
          category: sub.category,
          monthlyCost: sub.monthlyCost,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as SearchPricingResult;
        setPricingIntel(data);
      }
    } catch (err) {
      console.error('Error searching pricing with Google Grounding:', err);
    } finally {
      setIsSearchingPricing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Quadrant & Category Intelligence Header + Interactive Controls */}
      <div className={`${styles.cardClass} p-5`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-current/10">
          <div className="flex flex-wrap items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${styles.subPanelClass}`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <h2 className={`text-xl font-bold ${styles.headingFontClass}`}>
              01. Interactive Cost-vs-Usage Matrix &amp; Category Intelligence
            </h2>
            <button
              type="button"
              onClick={() => setShowCategoryIntelligence((prev) => !prev)}
              style={
                showCategoryIntelligence
                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                  : undefined
              }
              className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-colors ${
                showCategoryIntelligence ? '' : styles.subPanelClass
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {showCategoryIntelligence ? 'Categories Shown' : 'Show Categories'}
            </button>
          </div>

          <div className={`flex flex-wrap items-center gap-1 p-1 ${styles.subPanelClass} self-start`}>
            {(
              [
                ['ALL', `All (${subscriptions.length})`],
                ['DANGER_ZONE', `Danger Zone (${quadrantCounts.DANGER_ZONE.count})`],
                ['SILENT_LEAKS', `Silent Leaks (${quadrantCounts.SILENT_LEAKS.count})`],
                ['HIGH_VALUE', `High Value (${quadrantCounts.HIGH_VALUE.count})`],
                ['BARGAIN', `Bargain (${quadrantCounts.BARGAIN.count})`],
              ] as [typeof quadrantFilter, string][]
            ).map(([qKey, qLabel]) => (
              <button
                key={qKey}
                type="button"
                onClick={() => handleSelectQuadrant(qKey)}
                style={
                  quadrantFilter === qKey
                    ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                    : undefined
                }
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                {qLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Category Buttons Strip */}
        <div className="py-3 border-b border-current/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-semibold ${styles.mutedTextClass} mr-1`}>
              Categories:
            </span>
            <button
              type="button"
              onClick={() => handleSelectCategory('ALL')}
              style={
                categoryFilter === 'ALL'
                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                  : undefined
              }
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'ALL' ? '' : styles.subPanelClass
              }`}
            >
              All ({subscriptions.length})
            </button>
            {categoryIntelligence.map((catItem) => {
              const isSelected = categoryFilter === catItem.category;
              return (
                <button
                  key={catItem.category}
                  type="button"
                  onClick={() => handleSelectCategory(catItem.category)}
                  style={
                    isSelected
                      ? { backgroundColor: catItem.colorHex, color: '#FFFFFF' }
                      : undefined
                  }
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isSelected ? 'shadow-xs scale-102' : `${styles.subPanelClass} hover:opacity-90`
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: isSelected ? '#FFFFFF' : catItem.colorHex }}
                  />
                  <span>{catItem.category}</span>
                  <span className="font-mono text-[11px] opacity-80">
                    ({catItem.totalCount})
                  </span>
                </button>
              );
            })}

            {(categoryFilter !== 'ALL' || quadrantFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('ALL');
                  setQuadrantFilter('ALL');
                }}
                className={`px-2.5 py-1 text-xs font-semibold ${styles.subPanelClass} flex items-center gap-1 cursor-pointer`}
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filter
              </button>
            )}
          </div>

          <div className={`flex items-center gap-1 p-1 ${styles.subPanelClass} text-xs`}>
            <button
              type="button"
              onClick={() => setColorMode('CATEGORY')}
              style={
                colorMode === 'CATEGORY'
                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                  : undefined
              }
              className="px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Color by Category
            </button>
            <button
              type="button"
              onClick={() => setColorMode('QUADRANT')}
              style={
                colorMode === 'QUADRANT'
                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                  : undefined
              }
              className="px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Color by Quadrant
            </button>
          </div>
        </div>

        {/* Interactive Category Intelligence Cards Grid */}
        {showCategoryIntelligence && (
          <div className="py-3.5 border-b border-current/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {categoryIntelligence.map((catItem) => {
                const isSelected = categoryFilter === catItem.category;
                return (
                  <button
                    key={catItem.category}
                    type="button"
                    onClick={() => handleSelectCategory(catItem.category)}
                    style={
                      isSelected
                        ? { borderColor: catItem.colorHex, boxShadow: `0 0 0 1px ${catItem.colorHex}` }
                        : undefined
                    }
                    className={`${styles.subPanelClass} p-3 text-left transition-all cursor-pointer hover:opacity-95 flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-[11px] font-mono font-bold flex items-center gap-1.5"
                          style={{ color: catItem.colorHex }}
                        >
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: catItem.colorHex }}
                          />
                          {catItem.category}
                        </span>
                        <span className={`text-[10px] font-mono ${styles.mutedTextClass}`}>
                          {catItem.sharePct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-xs font-semibold mt-1 truncate">
                        {catItem.label}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-current/10">
                      <div className="flex items-baseline justify-between font-mono tabular-nums">
                        <span className="text-sm font-bold">
                          {formatCurrency(catItem.monthlyBurn, currency)}
                        </span>
                        <span className={`text-[10px] ${styles.mutedTextClass}`}>
                          {catItem.totalCount} subs
                        </span>
                      </div>
                      {catItem.items.length > 0 && (
                        <div className={`text-[10px] truncate mt-1 ${styles.mutedTextClass}`}>
                          {catItem.items.map((i) => i.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Interactive 4 Quadrant Buttons Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3.5">
          <button
            type="button"
            onClick={() => handleSelectQuadrant('DANGER_ZONE')}
            className={`p-3 text-left transition-all cursor-pointer rounded-lg border ${
              quadrantFilter === 'DANGER_ZONE'
                ? 'bg-red-500/15 border-red-500'
                : `${styles.subPanelClass} hover:border-red-500/50`
            }`}
          >
            <div className="text-xs text-red-600 font-semibold">
              Q1 · Danger Zone
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono tabular-nums">
                {formatCurrency(quadrantCounts.DANGER_ZONE.monthlyTotal, currency)}/mo
              </span>
              <span className={`text-xs font-mono tabular-nums ${styles.mutedTextClass}`}>
                {quadrantCounts.DANGER_ZONE.count} active
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectQuadrant('SILENT_LEAKS')}
            className={`p-3 text-left transition-all cursor-pointer rounded-lg border ${
              quadrantFilter === 'SILENT_LEAKS'
                ? 'bg-amber-500/15 border-amber-500'
                : `${styles.subPanelClass} hover:border-amber-500/50`
            }`}
          >
            <div className="text-xs text-amber-600 font-semibold">
              Q3 · Silent Leaks
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono tabular-nums">
                {formatCurrency(quadrantCounts.SILENT_LEAKS.monthlyTotal, currency)}/mo
              </span>
              <span className={`text-xs font-mono tabular-nums ${styles.mutedTextClass}`}>
                {quadrantCounts.SILENT_LEAKS.count} active
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectQuadrant('HIGH_VALUE')}
            className={`p-3 text-left transition-all cursor-pointer rounded-lg border ${
              quadrantFilter === 'HIGH_VALUE'
                ? 'bg-emerald-500/15 border-emerald-500'
                : `${styles.subPanelClass} hover:border-emerald-500/50`
            }`}
          >
            <div className="text-xs text-emerald-600 font-semibold">
              Q2 · High Value
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono tabular-nums">
                {formatCurrency(quadrantCounts.HIGH_VALUE.monthlyTotal, currency)}/mo
              </span>
              <span className={`text-xs font-mono tabular-nums ${styles.mutedTextClass}`}>
                {quadrantCounts.HIGH_VALUE.count} active
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectQuadrant('BARGAIN')}
            className={`p-3 text-left transition-all cursor-pointer rounded-lg border ${
              quadrantFilter === 'BARGAIN'
                ? 'bg-blue-500/15 border-blue-500'
                : `${styles.subPanelClass} hover:border-blue-500/50`
            }`}
          >
            <div className="text-xs text-blue-600 font-semibold">
              Q4 · Bargain
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono tabular-nums">
                {formatCurrency(quadrantCounts.BARGAIN.monthlyTotal, currency)}/mo
              </span>
              <span className={`text-xs font-mono tabular-nums ${styles.mutedTextClass}`}>
                {quadrantCounts.BARGAIN.count} active
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Matrix Canvas + Right Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className={`lg:col-span-8 ${styles.cardClass} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            {colorMode === 'CATEGORY' ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {SUBSCRIPTION_CATEGORIES.map((cat) => {
                  const active = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      style={
                        active
                          ? { backgroundColor: CATEGORY_CONFIG[cat].colorHex, color: '#FFFFFF' }
                          : undefined
                      }
                      className={`px-2 py-1 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors ${
                        active ? '' : styles.subPanelClass
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{
                          backgroundColor: active ? '#FFFFFF' : CATEGORY_CONFIG[cat].colorHex,
                        }}
                      />
                      <span className="font-mono text-[11px] font-semibold">{cat}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(
                  [
                    ['DANGER_ZONE', 'Danger Zone', '#DC2626'],
                    ['SILENT_LEAKS', 'Silent Leaks', '#D97706'],
                    ['HIGH_VALUE', 'High Value', '#16A34A'],
                    ['BARGAIN', 'Bargain', '#2563EB'],
                  ] as [QuadrantId, string, string][]
                ).map(([qId, label, hex]) => (
                  <button
                    key={qId}
                    type="button"
                    onClick={() => handleSelectQuadrant(qId)}
                    style={
                      quadrantFilter === qId
                        ? { backgroundColor: hex, color: '#FFFFFF' }
                        : undefined
                    }
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer ${
                      quadrantFilter === qId ? '' : styles.subPanelClass
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: quadrantFilter === qId ? '#FFFFFF' : hex }}
                    />
                    <span className="font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className={`flex flex-wrap items-center gap-3 text-xs ${styles.mutedTextClass}`}>
              <div className={`flex items-center gap-1 px-2 py-1 ${styles.subPanelClass}`}>
                <button
                  type="button"
                  onClick={() => setChartZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
                  className="p-0.5 hover:opacity-80 cursor-pointer"
                  title="Zoom Out Matrix"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartZoom(1)}
                  className="px-1 font-mono text-[11px] font-semibold cursor-pointer"
                  title="Reset Matrix Zoom"
                >
                  {Math.round(chartZoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setChartZoom((z) => Math.min(2, Number((z + 0.25).toFixed(2))))}
                  className="p-0.5 hover:opacity-80 cursor-pointer"
                  title="Zoom In Matrix"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <label className="flex items-center gap-1.5 font-mono tabular-nums">
                <SlidersHorizontal className="w-3 h-3" />
                <span>
                  {currencySym}
                  {costCutoff}
                </span>
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={5}
                  value={costCutoff}
                  onChange={(e) => setCostCutoff(Number(e.target.value))}
                  className="w-16 cursor-pointer"
                />
              </label>
              <label className="flex items-center gap-1.5 font-mono tabular-nums">
                <span>{usageCutoff}d</span>
                <input
                  type="range"
                  min={4}
                  max={20}
                  step={1}
                  value={usageCutoff}
                  onChange={(e) => setUsageCutoff(Number(e.target.value))}
                  className="w-16 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
            <button
              type="button"
              onClick={() => handleSelectQuadrant('DANGER_ZONE')}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 flex items-center justify-between rounded-sm cursor-pointer transition-colors"
            >
              <span className="font-semibold">Q1: Danger Zone</span>
              <span className="font-mono text-[11px]">
                &ge;{currencySym}
                {costCutoff} · &lt;{usageCutoff}d
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuadrant('HIGH_VALUE')}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-between rounded-sm cursor-pointer transition-colors"
            >
              <span className="font-semibold">Q2: High Value</span>
              <span className="font-mono text-[11px]">
                &ge;{currencySym}
                {costCutoff} · &ge;{usageCutoff}d
              </span>
            </button>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 24, bottom: 20, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGridStroke} />
                <XAxis
                  type="number"
                  dataKey="usageFrequency"
                  name="Usage Frequency"
                  domain={[0, zoomedMaxUsage]}
                  allowDataOverflow={true}
                  tickCount={7}
                  stroke={styles.chartAxisStroke}
                  fontSize={12}
                  tickFormatter={(v) => `${v}d`}
                />
                <YAxis
                  type="number"
                  dataKey="monthlyCost"
                  name="Monthly Cost"
                  domain={[0, zoomedMaxCost]}
                  allowDataOverflow={true}
                  stroke={styles.chartAxisStroke}
                  fontSize={12}
                  tickFormatter={(v) => `${currencySym}${v}`}
                />
                <ZAxis type="number" dataKey="monthlyCost" range={[120, 440]} />

                <ReferenceArea
                  x1={0}
                  x2={Math.min(usageCutoff, zoomedMaxUsage)}
                  y1={Math.min(costCutoff, zoomedMaxCost)}
                  y2={zoomedMaxCost}
                  fill="#EF4444"
                  fillOpacity={styles.isNight ? 0.14 : 0.18}
                />
                <ReferenceArea
                  x1={Math.min(usageCutoff, zoomedMaxUsage)}
                  x2={zoomedMaxUsage}
                  y1={Math.min(costCutoff, zoomedMaxCost)}
                  y2={zoomedMaxCost}
                  fill="#10B981"
                  fillOpacity={styles.isNight ? 0.14 : 0.18}
                />
                <ReferenceArea
                  x1={0}
                  x2={Math.min(usageCutoff, zoomedMaxUsage)}
                  y1={0}
                  y2={Math.min(costCutoff, zoomedMaxCost)}
                  fill="#F59E0B"
                  fillOpacity={styles.isNight ? 0.14 : 0.18}
                />
                <ReferenceArea
                  x1={Math.min(usageCutoff, zoomedMaxUsage)}
                  x2={zoomedMaxUsage}
                  y1={0}
                  y2={Math.min(costCutoff, zoomedMaxCost)}
                  fill="#3B82F6"
                  fillOpacity={styles.isNight ? 0.14 : 0.18}
                />

                <ReferenceLine
                  x={usageCutoff}
                  stroke={styles.chartAxisStroke}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <ReferenceLine
                  y={costCutoff}
                  stroke={styles.chartAxisStroke}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />

                <Tooltip
                  content={<MatrixTooltip currency={currency} />}
                  cursor={{ strokeDasharray: '3 3', stroke: styles.chartAxisStroke }}
                />

                <Scatter
                  name="Subscriptions"
                  data={filteredSubs}
                  onClick={(point) => {
                    if (point && point.payload) {
                      onSelectSub(point.payload as Subscription);
                      setPricingIntel(null);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {filteredSubs.map((entry) => {
                    const isSelected = selectedSub?.id === entry.id;
                    return (
                      <Cell
                        key={entry.id}
                        fill={getDotColor(entry)}
                        stroke={isSelected ? styles.accentHex : '#FFFFFF'}
                        strokeWidth={isSelected ? 3.5 : 1.5}
                        fillOpacity={entry.status === 'CANCELED' ? 0.45 : 0.92}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <button
              type="button"
              onClick={() => handleSelectQuadrant('SILENT_LEAKS')}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-between rounded-sm cursor-pointer transition-colors"
            >
              <span className="font-semibold">Q3: Silent Leaks</span>
              <span className="font-mono text-[11px]">
                &lt;{currencySym}
                {costCutoff} · &lt;{usageCutoff}d
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuadrant('BARGAIN')}
              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-between rounded-sm cursor-pointer transition-colors"
            >
              <span className="font-semibold">Q4: Bargain</span>
              <span className="font-mono text-[11px]">
                &lt;{currencySym}
                {costCutoff} · &ge;{usageCutoff}d
              </span>
            </button>
          </div>
        </div>

        {/* Right Detail Inspection Drawer */}
        <div className={`lg:col-span-4 ${styles.cardClass} p-5`}>
          {selectedSub ? (
            <div className="space-y-4">
              {(() => {
                const quad = getQuadrant(
                  selectedSub.monthlyCost,
                  selectedSub.usageFrequency,
                  costCutoff,
                  usageCutoff
                );
                const catCfg =
                  CATEGORY_CONFIG[selectedSub.category] || CATEGORY_CONFIG.OTHER;
                const costPerDayUsed =
                  selectedSub.usageFrequency > 0
                    ? selectedSub.monthlyCost / selectedSub.usageFrequency
                    : selectedSub.monthlyCost;
                const annualSpend = selectedSub.monthlyCost * 12;
                const utilizationScore10 = Number(
                  ((selectedSub.usageFrequency / 30) * 10).toFixed(1)
                );

                return (
                  <>
                    <div className={`border-b ${styles.dividerClass} pb-3`}>
                      <div className={`text-xs ${styles.mutedTextClass} flex items-center gap-1.5`}>
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: catCfg.colorHex }}
                        />
                        <span className="font-semibold">
                          {getCategoryDisplayLabel(selectedSub)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{selectedSub.billingCycle}</span>
                        <span aria-hidden="true">·</span>
                        <span style={{ color: quad.colorHex }} className="font-semibold">
                          {quad.label}
                        </span>
                      </div>
                      <h3 className={`text-xl font-bold mt-1 ${styles.headingFontClass}`}>
                        {selectedSub.name}
                      </h3>
                      <div className={`text-xs mt-0.5 font-mono tabular-nums ${styles.mutedTextClass}`}>
                        Renews{' '}
                        {new Date(selectedSub.renewalDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    {/* Unit Economics Grid in Selected Currency */}
                    <div className={`grid grid-cols-3 gap-3 border-b ${styles.dividerClass} pb-3`}>
                      <div>
                        <div className={`text-xs ${styles.mutedTextClass}`}>Monthly</div>
                        <div className="text-base font-semibold font-mono tabular-nums mt-0.5">
                          {formatCurrency(selectedSub.monthlyCost, currency)}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs ${styles.mutedTextClass}`}>Annualized</div>
                        <div className="text-base font-semibold font-mono tabular-nums mt-0.5">
                          {formatCurrency(annualSpend, currency, 0)}/yr
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs ${styles.mutedTextClass}`}>Cost / Use</div>
                        <div
                          className={`text-base font-semibold font-mono tabular-nums mt-0.5 ${
                            costPerDayUsed > 10 ? 'text-red-500' : ''
                          }`}
                        >
                          {formatCurrency(costPerDayUsed, currency)}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Category Assignment Buttons */}
                    <div className={`space-y-2 border-b ${styles.dividerClass} pb-3 text-xs`}>
                      <div className="flex items-center justify-between">
                        <label className="font-semibold">Subscription Category</label>
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomCat((prev) => !prev)}
                          className="text-[11px] font-medium underline flex items-center gap-0.5 cursor-pointer"
                          style={{ color: styles.accentHex }}
                        >
                          <Plus className="w-3 h-3" />
                          {isAddingCustomCat ? 'Close' : 'Custom Tag'}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {SUBSCRIPTION_CATEGORIES.map((cat) => {
                          const active = selectedSub.category === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() =>
                                onUpdateSub(selectedSub.id, {
                                  category: cat,
                                })
                              }
                              style={
                                active
                                  ? {
                                      backgroundColor: CATEGORY_CONFIG[cat].colorHex,
                                      color: '#FFFFFF',
                                    }
                                  : undefined
                              }
                              className={`py-1.5 px-2 rounded-md font-mono text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                                active ? '' : styles.subPanelClass
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: active
                                    ? '#FFFFFF'
                                    : CATEGORY_CONFIG[cat].colorHex,
                                }}
                              />
                              <span className="truncate">{cat}</span>
                            </button>
                          );
                        })}
                      </div>

                      {isAddingCustomCat && (
                        <form
                          onSubmit={handleSaveCustomCategoryForSelected}
                          className="flex items-center gap-1.5 pt-1"
                        >
                          <input
                            type="text"
                            value={newCustomCatInput}
                            onChange={(e) => setNewCustomCatInput(e.target.value)}
                            placeholder="Custom tag..."
                            className={`flex-1 px-2.5 py-1.5 border ${styles.inputClass} text-xs focus:outline-none`}
                          />
                          <button
                            type="submit"
                            style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                            className="px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Save
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Interactive Usage Frequency Calibration Slider */}
                    <div className={`space-y-1.5 border-b ${styles.dividerClass} pb-3`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">Usage Frequency</span>
                        <span className="font-mono tabular-nums font-semibold">
                          {selectedSub.usageFrequency}d/mo ({utilizationScore10}/10)
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        step={1}
                        value={selectedSub.usageFrequency}
                        onChange={(e) =>
                          onUpdateSub(selectedSub.id, {
                            usageFrequency: Number(e.target.value),
                          })
                        }
                        className="w-full cursor-pointer"
                      />
                    </div>

                    {/* Interactive Lifecycle Status Selector */}
                    <div className={`space-y-1.5 border-b ${styles.dividerClass} pb-3`}>
                      <div className="text-xs font-semibold">Status</div>
                      <div className={`grid grid-cols-3 gap-1 p-1 ${styles.subPanelClass}`}>
                        {(['ACTIVE', 'CANCELING', 'CANCELED'] as SubscriptionStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => onUpdateSub(selectedSub.id, { status: st })}
                              style={
                                selectedSub.status === st
                                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                                  : undefined
                              }
                              className="py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {st}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Primary Action Stack */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenAiModal(selectedSub)}
                        style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                        className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <FileWarning className="w-4 h-4" />
                        Draft Cancellation Message
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCheckLivePricingWithGoogle(selectedSub)}
                        disabled={isSearchingPricing}
                        className={`w-full py-2 px-4 text-xs font-semibold ${styles.subPanelClass} hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap`}
                      >
                        {isSearchingPricing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" style={{ color: styles.accentHex }} />
                        )}
                        {isSearchingPricing
                          ? 'Searching Live Pricing...'
                          : 'Live Google Pricing Benchmark'}
                      </button>

                      {pricingIntel && pricingIntel.subscriptionName === selectedSub.name && (
                        <div className={`${styles.subPanelClass} p-3 space-y-1.5 text-xs max-h-44 overflow-y-auto`}>
                          <div className="font-semibold flex items-center gap-1.5" style={{ color: styles.accentHex }}>
                            <Globe className="w-3.5 h-3.5" />
                            <span>Live Pricing Benchmark</span>
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed text-[11px]">
                            {pricingIntel.summary}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onSimulateCut(selectedSub.id)}
                        className={`w-full py-2 px-4 text-xs font-medium ${styles.subPanelClass} flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap`}
                      >
                        <TrendingDown className="w-4 h-4" />
                        Simulate Cut in What-If Calculator
                      </button>

                      <div className="flex items-center justify-between pt-1.5">
                        {selectedSub.cancellationUrl ? (
                          <a
                            href={selectedSub.cancellationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium underline underline-offset-4 flex items-center gap-1"
                          >
                            Billing Portal
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className={`text-xs ${styles.mutedTextClass}`}>
                            Direct Portal
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteSub(selectedSub.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="text-sm font-semibold">Select a Subscription Node</div>
            </div>
          )}
        </div>
      </div>

      {/* High-Density Subscription Ledger Table */}
      <div className={`${styles.cardClass} overflow-hidden`}>
        <div className={`px-5 py-3.5 border-b ${styles.dividerClass} flex flex-wrap items-center justify-between gap-2`}>
          <h3 className={`text-lg font-bold ${styles.headingFontClass}`}>
            02. Recurring Expense Ledger ({currency})
          </h3>
          <div className={`text-xs font-mono tabular-nums ${styles.mutedTextClass}`}>
            {filteredSubs.length} of {subscriptions.length} subscriptions
          </div>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 backdrop-blur-md">
              <tr className={`border-b ${styles.dividerClass} text-[11px] font-semibold ${styles.mutedTextClass}`}>
                <th className="py-2.5 px-4">Service Name</th>
                <th className="py-2.5 px-4">Category · Cycle</th>
                <th className="py-2.5 px-4">Renewal Date</th>
                <th className="py-2.5 px-4">Quadrant</th>
                <th className="py-2.5 px-4 text-right">Usage</th>
                <th className="py-2.5 px-4 text-right">
                  Monthly Cost ({currencySym.trim()})
                </th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${styles.dividerClass} text-xs`}>
              {filteredSubs.map((sub) => {
                const quad = getQuadrant(
                  sub.monthlyCost,
                  sub.usageFrequency,
                  costCutoff,
                  usageCutoff
                );
                const catCfg = CATEGORY_CONFIG[sub.category] || CATEGORY_CONFIG.OTHER;
                const isSelected = selectedSub?.id === sub.id;

                return (
                  <tr
                    key={sub.id}
                    onClick={() => onSelectSub(sub)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-500/10' : 'hover:bg-slate-500/5'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold whitespace-nowrap">{sub.name}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCategory(sub.category);
                        }}
                        className="font-mono font-semibold underline-offset-2 hover:underline cursor-pointer"
                        style={{ color: catCfg.colorHex }}
                      >
                        {sub.category}
                      </button>
                      {sub.customCategory && (
                        <span className={`ml-1 ${styles.mutedTextClass}`}>
                          ({sub.customCategory})
                        </span>
                      )}
                      <span className="mx-1.5 opacity-40" aria-hidden="true">
                        ·
                      </span>
                      <span className={`font-mono text-[11px] ${styles.mutedTextClass}`}>
                        {sub.billingCycle}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 font-mono tabular-nums whitespace-nowrap ${styles.mutedTextClass}`}>
                      {new Date(sub.renewalDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectQuadrant(quad.id);
                        }}
                        className="font-semibold hover:underline cursor-pointer"
                        style={{ color: quad.colorHex }}
                      >
                        {quad.label}
                      </button>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {sub.usageFrequency}d/mo
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap">
                      {formatCurrency(sub.monthlyCost, currency)}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] whitespace-nowrap">
                      <span
                        className={
                          sub.status === 'ACTIVE'
                            ? 'text-emerald-600 font-medium'
                            : sub.status === 'CANCELING'
                            ? 'text-amber-600 font-medium'
                            : 'opacity-40 line-through'
                        }
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td
                      className="py-2.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenAiModal(sub)}
                        style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                        className="px-2.5 py-1 text-xs font-medium rounded-md hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                      >
                        Opt-Out
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
