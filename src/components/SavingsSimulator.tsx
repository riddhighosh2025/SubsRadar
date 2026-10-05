import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  HistoricalBurnPoint,
  SavedScenario,
  Subscription,
  formatCurrency,
  getCurrencySymbol,
  getQuadrant,
} from '../types/subscription.ts';
import { ComputedThemeStyles } from '../types/theme.ts';
import {
  ArrowLeft,
  BookmarkPlus,
  CheckSquare,
  Edit3,
  FileWarning,
  RotateCcw,
  Square,
  Trash2,
  TrendingDown,
} from 'lucide-react';

interface SavingsSimulatorProps {
  subscriptions: Subscription[];
  canceledIds: string[];
  historicalBurn: HistoricalBurnPoint[];
  monthlySavingGoal: number;
  currency: string;
  styles: ComputedThemeStyles;
  onBack?: () => void;
  onToggleCut: (subId: string) => void;
  onSetCanceledIds: (ids: string[]) => void;
  onUpdateHistoricalBurn: (updatedHistory: HistoricalBurnPoint[]) => Promise<void>;
  savedScenarios: SavedScenario[];
  onSaveScenario: (payload: {
    name: string;
    targetSavings: number;
    canceledSubscriptionIds: string[];
    annualROI: number;
  }) => Promise<void>;
  onDeleteScenario: (id: string) => Promise<void>;
  onOpenAiModal: (sub: Subscription) => void;
}

function calculateCompoundProjection(
  monthlySavings: number,
  months: number,
  annualYieldRate = 0.07
): number {
  if (monthlySavings <= 0 || months <= 0) return 0;
  const monthlyRate = annualYieldRate / 12;
  if (monthlyRate === 0) return monthlySavings * months;
  return monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

export const SavingsSimulator: React.FC<SavingsSimulatorProps> = ({
  subscriptions,
  canceledIds,
  historicalBurn,
  monthlySavingGoal,
  currency,
  styles,
  onBack,
  onToggleCut,
  onSetCanceledIds,
  onUpdateHistoricalBurn,
  savedScenarios,
  onSaveScenario,
  onDeleteScenario,
  onOpenAiModal,
}) => {
  const [horizonMonths, setHorizonMonths] = useState<number>(60);
  const [annualYield, setAnnualYield] = useState<number>(0.07);
  const [scenarioName, setScenarioName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditingHistory, setIsEditingHistory] = useState<boolean>(false);

  const currencySym = getCurrencySymbol(currency);

  const activeSubs = useMemo(
    () => subscriptions.filter((s) => s.status !== 'CANCELED'),
    [subscriptions]
  );

  const baselineMonthlySpend = useMemo(
    () => activeSubs.reduce((acc, s) => acc + s.monthlyCost, 0),
    [activeSubs]
  );

  const instantMonthlySavings = useMemo(
    () =>
      activeSubs
        .filter((s) => canceledIds.includes(s.id))
        .reduce((acc, s) => acc + s.monthlyCost, 0),
    [activeSubs, canceledIds]
  );

  const optimizedMonthlySpend = Math.max(0, baselineMonthlySpend - instantMonthlySavings);
  const annualSavings = instantMonthlySavings * 12;
  const fiveYearCompoundSavings = useMemo(
    () => calculateCompoundProjection(instantMonthlySavings, 60, annualYield),
    [instantMonthlySavings, annualYield]
  );

  const twelveMonthBurnData = useMemo(() => {
    return historicalBurn.map((pt, index) => {
      const isLatestMonth = index === historicalBurn.length - 1;
      const simulatedBurnAfterCuts = isLatestMonth
        ? Number(optimizedMonthlySpend.toFixed(2))
        : pt.subscriptionBurn;
      return {
        ...pt,
        subscriptionBurn: Number(pt.subscriptionBurn.toFixed(2)),
        simulatedBurn: simulatedBurnAfterCuts,
        targetBurn: Number(pt.targetBurn.toFixed(2)),
      };
    });
  }, [historicalBurn, optimizedMonthlySpend]);

  const historyStats = useMemo(() => {
    if (twelveMonthBurnData.length === 0) {
      return { peakBurn: 0, startBurn: 0, currentBurn: 0, totalDrop: 0, pctDrop: 0 };
    }
    const startBurn = twelveMonthBurnData[0].subscriptionBurn;
    const peakBurn = Math.max(...twelveMonthBurnData.map((d) => d.subscriptionBurn));
    const currentBurn = optimizedMonthlySpend;
    const totalDrop = Math.max(0, peakBurn - currentBurn);
    const pctDrop = peakBurn > 0 ? (totalDrop / peakBurn) * 100 : 0;
    return { peakBurn, startBurn, currentBurn, totalDrop, pctDrop };
  }, [twelveMonthBurnData, optimizedMonthlySpend]);

  const projectionData = useMemo(() => {
    const points = [];
    const step = horizonMonths <= 24 ? 2 : 3;
    for (let m = 0; m <= horizonMonths; m += step) {
      const baselineCumulative = Number((baselineMonthlySpend * m).toFixed(2));
      const optimizedNetSpend = Number((optimizedMonthlySpend * m).toFixed(2));
      const compoundSavingsGrowth = Number(
        calculateCompoundProjection(instantMonthlySavings, m, annualYield).toFixed(2)
      );
      points.push({
        month: m,
        label: `Mo ${m}`,
        baselineSpend: baselineCumulative,
        optimizedSpend: optimizedNetSpend,
        compoundSavings: compoundSavingsGrowth,
      });
    }
    return points;
  }, [
    horizonMonths,
    baselineMonthlySpend,
    optimizedMonthlySpend,
    instantMonthlySavings,
    annualYield,
  ]);

  const handlePresetDangerZone = () => {
    const dangerIds = activeSubs
      .filter((s) => getQuadrant(s.monthlyCost, s.usageFrequency).id === 'DANGER_ZONE')
      .map((s) => s.id);
    onSetCanceledIds(dangerIds);
  };

  const handlePresetLowUsageAll = () => {
    const lowIds = activeSubs
      .filter((s) => {
        const q = getQuadrant(s.monthlyCost, s.usageFrequency).id;
        return q === 'DANGER_ZONE' || q === 'SILENT_LEAKS';
      })
      .map((s) => s.id);
    onSetCanceledIds(lowIds);
  };

  const handleApplySimulatedCutToCurrentMonth = async () => {
    if (historicalBurn.length === 0) return;
    const updated = historicalBurn.map((pt, idx) =>
      idx === historicalBurn.length - 1
        ? { ...pt, subscriptionBurn: Number(optimizedMonthlySpend.toFixed(2)) }
        : pt
    );
    await onUpdateHistoricalBurn(updated);
  };

  const handleEditMonthBurn = async (index: number, newVal: number) => {
    const updated = historicalBurn.map((pt, idx) =>
      idx === index ? { ...pt, subscriptionBurn: Math.max(0, newVal) } : pt
    );
    await onUpdateHistoricalBurn(updated);
  };

  const handleSaveCurrentScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canceledIds.length === 0) return;
    setIsSaving(true);
    try {
      const label =
        scenarioName.trim() ||
        `Cut ${canceledIds.length} Services (${formatCurrency(instantMonthlySavings, currency, 0)}/mo)`;
      await onSaveScenario({
        name: label,
        targetSavings: Number(instantMonthlySavings.toFixed(2)),
        canceledSubscriptionIds: canceledIds,
        annualROI: Number(fiveYearCompoundSavings.toFixed(2)),
      });
      setScenarioName('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Financial Impact Strip */}
      <div className={`${styles.cardClass} p-5`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-current/10">
          <div className="flex items-center gap-3">
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
              01. What-If Compound Savings Simulator &amp; 12-Month Burn Tracker ({currency})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePresetDangerZone}
              className="px-3 py-1.5 text-xs font-semibold bg-red-500/15 text-red-600 dark:text-red-300 rounded-md hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap"
            >
              Cut Danger Zone
            </button>
            <button
              type="button"
              onClick={handlePresetLowUsageAll}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-300 rounded-md hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap"
            >
              Cut Danger + Silent Leaks
            </button>
            <button
              type="button"
              onClick={() => onSetCanceledIds([])}
              className={`px-3 py-1.5 text-xs font-semibold ${styles.subPanelClass} flex items-center gap-1 cursor-pointer whitespace-nowrap`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* 4 Key Simulator Financial Metrics in Selected Currency */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x ${styles.dividerClass} pt-4`}>
          <div className="pr-4 py-2 sm:py-0">
            <div className={`text-xs ${styles.mutedTextClass}`}>Instant Monthly Savings</div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-600">
              +{formatCurrency(instantMonthlySavings, currency)}
              <span className={`text-xs font-normal ${styles.mutedTextClass}`}>/mo</span>
            </div>
          </div>

          <div className="sm:px-4 py-2 sm:py-0">
            <div className={`text-xs ${styles.mutedTextClass}`}>Annualized Cashflow Saved</div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums">
              {formatCurrency(annualSavings, currency)}
              <span className={`text-xs font-normal ${styles.mutedTextClass}`}>/yr</span>
            </div>
          </div>

          <div className="sm:px-4 py-2 sm:py-0">
            <div className={`text-xs ${styles.mutedTextClass}`}>
              5-Year Compound Projection ({(annualYield * 100).toFixed(0)}% APY)
            </div>
            <div
              className="mt-1 text-2xl font-bold font-mono tabular-nums"
              style={{ color: styles.accentHex }}
            >
              {formatCurrency(fiveYearCompoundSavings, currency)}
            </div>
          </div>

          <div className="sm:pl-4 py-2 sm:py-0">
            <div className={`text-xs ${styles.mutedTextClass}`}>
              12-Month Burn Reduction
            </div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-600">
              -{formatCurrency(historyStats.totalDrop, currency)}
              <span className={`text-xs font-normal ${styles.mutedTextClass}`}>/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* 12-Month Historical Subscription Burn Recharts LineChart */}
      <div className={`${styles.cardClass} p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" style={{ color: styles.accentHex }} />
            <h3 className={`text-lg font-bold ${styles.headingFontClass}`}>
              12-Month Historical Subscription Burn ({currencySym.trim()})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleApplySimulatedCutToCurrentMonth}
              style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
              className="px-3 py-1.5 text-xs font-semibold rounded-md hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            >
              Commit Current Cut ({formatCurrency(optimizedMonthlySpend, currency)}/mo)
            </button>
            <button
              type="button"
              onClick={() => setIsEditingHistory((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold ${styles.subPanelClass} flex items-center gap-1.5 cursor-pointer whitespace-nowrap`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingHistory ? 'Hide Editor' : 'Edit 12-Month History'}
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={twelveMonthBurnData}
              margin={{ top: 12, right: 24, bottom: 8, left: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGridStroke} />
              <XAxis dataKey="month" stroke={styles.chartAxisStroke} fontSize={12} />
              <YAxis
                stroke={styles.chartAxisStroke}
                fontSize={12}
                tickFormatter={(v) => `${currencySym}${v}`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${formatCurrency(Number(value), currency)}/mo`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: styles.chartTooltipBg,
                  borderColor: styles.accentHex,
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <ReferenceLine
                y={500}
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{
                  value: `Target (${currencySym}500/mo)`,
                  position: 'insideTopRight',
                  fill: '#10B981',
                  fontSize: 11,
                }}
              />
              <Line
                type="monotone"
                dataKey="subscriptionBurn"
                name={`Historical Burn (${currencySym.trim()}/mo)`}
                stroke={styles.accentHex}
                strokeWidth={3}
                dot={{ r: 4, fill: styles.accentHex }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="simulatedBurn"
                name={`Simulated Burn (${currencySym.trim()}/mo)`}
                stroke="#10B981"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {isEditingHistory && (
          <div className={`pt-3 border-t ${styles.dividerClass}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
              {historicalBurn.map((pt, idx) => (
                <div key={pt.month} className={`${styles.subPanelClass} p-2`}>
                  <label className={`block text-[11px] font-mono ${styles.mutedTextClass}`}>
                    {pt.month} ({currencySym.trim()})
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={pt.subscriptionBurn}
                    onChange={(e) => handleEditMonthBurn(idx, parseFloat(e.target.value) || 0)}
                    className={`w-full mt-1 px-2 py-1 font-mono text-xs border ${styles.inputClass}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Split View: Interactive Subscription Toggle Checklist + 5-Year Compound Trajectory Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className={`lg:col-span-5 ${styles.cardClass} overflow-hidden`}>
          <div className={`px-5 py-3.5 border-b ${styles.dividerClass} flex items-center justify-between`}>
            <h3 className="text-sm font-semibold">
              Subscriptions Checklist
            </h3>
            <span className={`text-xs font-mono tabular-nums ${styles.mutedTextClass}`}>
              {currencySym.trim()}/mo
            </span>
          </div>

          <div className={`divide-y ${styles.dividerClass} max-h-[440px] overflow-y-auto`}>
            {activeSubs.map((sub) => {
              const isCut = canceledIds.includes(sub.id);
              const quad = getQuadrant(sub.monthlyCost, sub.usageFrequency);

              return (
                <div
                  key={sub.id}
                  onClick={() => onToggleCut(sub.id)}
                  className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isCut ? 'bg-emerald-500/10' : 'hover:bg-slate-500/5'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      aria-label={`Toggle ${sub.name}`}
                      className="mt-0.5 focus:outline-none"
                    >
                      {isCut ? (
                        <Square className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <CheckSquare className="w-4 h-4" style={{ color: styles.accentHex }} />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-semibold truncate ${
                          isCut ? 'line-through opacity-50' : ''
                        }`}
                      >
                        {sub.name}
                      </div>
                      <div className={`text-[11px] ${styles.mutedTextClass} flex items-center gap-1.5`}>
                        <span style={{ color: quad.colorHex }} className="font-medium">
                          {quad.label}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{sub.usageFrequency}d/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right font-mono tabular-nums">
                      <div
                        className={`text-xs font-semibold ${
                          isCut ? 'text-emerald-600' : ''
                        }`}
                      >
                        {isCut
                          ? `+${formatCurrency(sub.monthlyCost, currency)}`
                          : formatCurrency(sub.monthlyCost, currency)}
                      </div>
                    </div>

                    {isCut && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAiModal(sub);
                        }}
                        title="Generate Cancellation Script"
                        style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                        className="p-1.5 rounded-md transition-opacity hover:opacity-90 cursor-pointer"
                      >
                        <FileWarning className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleSaveCurrentScenario}
            className={`p-3.5 border-t ${styles.dividerClass} flex items-center gap-2`}
          >
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Scenario name..."
              className={`flex-1 px-3 py-1.5 text-xs border ${styles.inputClass} focus:outline-none`}
            />
            <button
              type="submit"
              disabled={canceledIds.length === 0 || isSaving}
              style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
              className="px-3 py-1.5 text-xs font-semibold rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save
            </button>
          </form>
        </div>

        {/* Right 5-Year Compound Trajectory Chart + Saved Scenarios List */}
        <div className="lg:col-span-7 space-y-5">
          <div className={`${styles.cardClass} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className={`text-base font-bold ${styles.headingFontClass}`}>
                Baseline Spend vs. Compound Savings Trajectory ({currencySym.trim()})
              </h3>

              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 p-1 ${styles.subPanelClass} text-xs`}>
                  {[12, 36, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setHorizonMonths(m)}
                      style={
                        horizonMonths === m
                          ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                          : undefined
                      }
                      className="px-2.5 py-1 rounded-md font-mono font-medium transition-colors cursor-pointer"
                    >
                      {m}m
                    </button>
                  ))}
                </div>

                <div className={`flex items-center gap-1 p-1 ${styles.subPanelClass} text-xs`}>
                  {[0.05, 0.07, 0.09].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setAnnualYield(rate)}
                      style={
                        annualYield === rate
                          ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                          : undefined
                      }
                      className="px-2 py-1 rounded-md font-mono font-medium transition-colors cursor-pointer"
                    >
                      {(rate * 100).toFixed(0)}% APY
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={projectionData}
                  margin={{ top: 12, right: 20, bottom: 8, left: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGridStroke} />
                  <XAxis dataKey="label" stroke={styles.chartAxisStroke} fontSize={12} />
                  <YAxis
                    stroke={styles.chartAxisStroke}
                    fontSize={12}
                    tickFormatter={(v) => `${currencySym}${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(Number(value), currency),
                    ]}
                    contentStyle={{
                      backgroundColor: styles.chartTooltipBg,
                      borderColor: styles.accentHex,
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="baselineSpend"
                    name="Baseline Cumulative Spend"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="optimizedSpend"
                    name="Optimized Net Spend"
                    stroke={styles.accentHex}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="compoundSavings"
                    name={`Compound Savings (${(annualYield * 100).toFixed(0)}% Yield)`}
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${styles.cardClass} overflow-hidden`}>
            <div className={`px-5 py-3 border-b ${styles.dividerClass} flex items-center justify-between`}>
              <h3 className="text-sm font-semibold">Saved Scenarios</h3>
              <span className={`text-xs font-mono ${styles.mutedTextClass}`}>
                {savedScenarios.length}
              </span>
            </div>

            {savedScenarios.length > 0 && (
              <div className={`divide-y ${styles.dividerClass} max-h-48 overflow-y-auto`}>
                {savedScenarios.map((scen) => (
                  <div
                    key={scen.id}
                    className="px-5 py-2.5 flex items-center justify-between gap-4 hover:bg-slate-500/5 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold">{scen.name}</div>
                      <div className={`text-[11px] font-mono tabular-nums ${styles.mutedTextClass}`}>
                        -{formatCurrency(scen.targetSavings, currency)}/mo · 5-Yr:{' '}
                        {formatCurrency(scen.annualROI, currency)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSetCanceledIds(scen.canceledSubscriptionIds)}
                        style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteScenario(scen.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Scenario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
