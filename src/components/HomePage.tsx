import React from 'react';
import { formatCurrency } from '../types/subscription.ts';
import { ComputedThemeStyles, ThemeConfig } from '../types/theme.ts';
import { ThemeControlBar } from './ThemeControlBar.tsx';
import { SubsRadarLogo } from './SubsRadarLogo.tsx';
import {
  ArrowRight,
  Compass,
  FileWarning,
  Globe,
  LineChart,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

interface HomePageProps {
  currency: string;
  themeConfig: ThemeConfig;
  styles: ComputedThemeStyles;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onChangeTheme: (updates: Partial<ThemeConfig>) => void;
  onNavigateAuth: (initialMode: 'login' | 'register') => void;
  onEnterDemoDashboard: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currency,
  themeConfig,
  styles,
  zoomLevel,
  onZoomChange,
  onChangeTheme,
  onNavigateAuth,
  onEnterDemoDashboard,
}) => {
  return (
    <div className="space-y-8 py-2">
      {/* Live Theme, Zoom & Aesthetic Experience Switcher */}
      <ThemeControlBar
        themeConfig={themeConfig}
        styles={styles}
        onChangeTheme={onChangeTheme}
        zoomLevel={zoomLevel}
        onZoomChange={onZoomChange}
      />

      {/* Hero Section (Main Headings & Titles Only) */}
      <section className={`${styles.cardClass} p-8 sm:p-10 relative overflow-hidden`}>
        {themeConfig.aestheticMode === 'pastel' && (
          <svg
            aria-hidden="true"
            className="w-56 h-56 absolute -right-10 -top-10 opacity-10 pointer-events-none"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path
              d="M100 20C120 60 160 60 180 100C160 140 120 140 100 180C80 140 40 140 20 100C40 60 80 60 100 20Z"
              stroke={styles.accentHex}
              strokeWidth="4"
            />
            <circle cx="100" cy="100" r="28" stroke={styles.accentHex} strokeWidth="3" />
          </svg>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3">
              <SubsRadarLogo
                accentHex={styles.accentHex}
                headingFontClass={styles.headingFontClass}
                size="md"
              />
              <span className={`text-xs font-semibold ${styles.mutedTextClass}`}>
                · {styles.modeBadgeLabel}
              </span>
            </div>

            <h1
              className={`text-3xl sm:text-5xl font-bold leading-tight ${styles.headingFontClass}`}
            >
              Audit Every Recurring Expense. Cut Silent Leaks &amp; Compound Your Savings.
            </h1>

            {/* Primary Conversion Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateAuth('register')}
                style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                className="px-6 py-3 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up &amp; Set Saving Goals
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateAuth('login')}
                className={`px-5 py-3 text-sm font-semibold ${styles.subPanelClass} hover:opacity-85 transition-opacity flex items-center gap-2 cursor-pointer whitespace-nowrap`}
              >
                <LogIn className="w-4 h-4" />
                Log In
              </button>

              <button
                type="button"
                onClick={onEnterDemoDashboard}
                className={`px-4 py-3 text-xs font-semibold underline underline-offset-4 ${styles.mutedTextClass} hover:opacity-100 cursor-pointer whitespace-nowrap`}
              >
                Explore Demo Workspace
              </button>
            </div>
          </div>

          {/* Right Live Interactive Preview Card */}
          <div className={`lg:col-span-5 ${styles.subPanelClass} p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b pb-2.5 border-current/10">
              <div className={`text-sm font-bold ${styles.headingFontClass}`}>
                4-Quadrant Matrix &amp; Goal Tracker ({currency})
              </div>
              <span
                className="font-mono text-xs font-semibold"
                style={{ color: styles.accentHex }}
              >
                -{formatCurrency(422.98, currency)}/mo Cut
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={onEnterDemoDashboard}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-left hover:bg-red-500/15 cursor-pointer"
              >
                <div className="font-semibold text-red-600 dark:text-red-400">
                  Q1 · Danger Zone
                </div>
                <div className="font-mono text-sm font-bold mt-1">
                  {formatCurrency(422.98, currency)}/mo
                </div>
              </button>

              <button
                type="button"
                onClick={onEnterDemoDashboard}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-left hover:bg-emerald-500/15 cursor-pointer"
              >
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Q2 · High Value
                </div>
                <div className="font-mono text-sm font-bold mt-1">
                  {formatCurrency(242.5, currency)}/mo
                </div>
              </button>

              <button
                type="button"
                onClick={onEnterDemoDashboard}
                className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-left hover:bg-amber-500/15 cursor-pointer"
              >
                <div className="font-semibold text-amber-600 dark:text-amber-400">
                  Q3 · Silent Leaks
                </div>
                <div className="font-mono text-sm font-bold mt-1">
                  {formatCurrency(56.42, currency)}/mo
                </div>
              </button>

              <button
                type="button"
                onClick={onEnterDemoDashboard}
                className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left hover:bg-blue-500/15 cursor-pointer"
              >
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  Q4 · Bargain
                </div>
                <div className="font-mono text-sm font-bold mt-1">
                  {formatCurrency(59.97, currency)}/mo
                </div>
              </button>
            </div>

            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">12-Month Burn Reduction</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {formatCurrency(1025, currency, 0)}/mo → {formatCurrency(558, currency, 0)}/mo (-45.5%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-500/15 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: '68%', backgroundColor: styles.accentHex }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section (Concise Main Headings & Titles Only) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={onEnterDemoDashboard}
          className={`${styles.cardClass} p-5 text-left hover:opacity-90 transition-opacity cursor-pointer space-y-2`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: styles.accentHex }}>
            <Compass className="w-4 h-4" />
            <span>01. Matrix &amp; Ledger</span>
          </div>
          <h2 className={`text-lg font-bold ${styles.headingFontClass}`}>
            Cost-vs-Usage Visual Matrix &amp; Category Intelligence
          </h2>
        </button>

        <button
          type="button"
          onClick={onEnterDemoDashboard}
          className={`${styles.cardClass} p-5 text-left hover:opacity-90 transition-opacity cursor-pointer space-y-2`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: styles.accentHex }}>
            <LineChart className="w-4 h-4" />
            <span>02. What-If Simulator</span>
          </div>
          <h2 className={`text-lg font-bold ${styles.headingFontClass}`}>
            12-Month Historical Burn &amp; 5-Year Compound Yield
          </h2>
        </button>

        <button
          type="button"
          onClick={onEnterDemoDashboard}
          className={`${styles.cardClass} p-5 text-left hover:opacity-90 transition-opacity cursor-pointer space-y-2`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: styles.accentHex }}>
            <Globe className="w-4 h-4" />
            <span>03. Live Pricing</span>
          </div>
          <h2 className={`text-lg font-bold ${styles.headingFontClass}`}>
            Google Search Grounded Plan Benchmarks
          </h2>
        </button>

        <button
          type="button"
          onClick={onEnterDemoDashboard}
          className={`${styles.cardClass} p-5 text-left hover:opacity-90 transition-opacity cursor-pointer space-y-2`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: styles.accentHex }}>
            <FileWarning className="w-4 h-4" />
            <span>04. AI Action Engine</span>
          </div>
          <h2 className={`text-lg font-bold ${styles.headingFontClass}`}>
            Cycle-Aligned Opt-Out &amp; PDF Dispatch
          </h2>
        </button>
      </section>

      {/* Bottom Conversion Strip */}
      <section className={`${styles.cardClass} p-6 flex flex-col sm:flex-row items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: styles.accentHex }} />
          <h3 className={`text-xl font-bold ${styles.headingFontClass}`}>
            Personal Recurring Expense Radar &amp; Saving Goals Vault
          </h3>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateAuth('register')}
            style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
            className="px-5 py-2.5 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => onNavigateAuth('login')}
            className={`px-5 py-2.5 text-xs font-semibold ${styles.subPanelClass} hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap`}
          >
            Sign In
          </button>
        </div>
      </section>
    </div>
  );
};
