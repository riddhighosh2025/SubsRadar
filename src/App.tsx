import React, { useEffect, useMemo, useState } from 'react';
import {
  BillingCycle,
  HistoricalBurnPoint,
  ParsedStatementItem,
  SavedScenario,
  Subscription,
  SubscriptionCategory,
  SubscriptionStatus,
  User,
  UserFinancialProfile,
  getQuadrant,
} from './types/subscription.ts';
import { ThemeConfig, getComputedTheme } from './types/theme.ts';
import { CostVsUsageMatrix } from './components/CostVsUsageMatrix.tsx';
import { SavingsSimulator } from './components/SavingsSimulator.tsx';
import { GemmaActionModal } from './components/GemmaActionModal.tsx';
import { StatementParserModal } from './components/StatementParserModal.tsx';
import { AddSubscriptionModal } from './components/AddSubscriptionModal.tsx';
import { AuthAccountModal } from './components/AuthAccountModal.tsx';
import { HomePage } from './components/HomePage.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { CookiesConsentPage } from './components/CookiesConsentPage.tsx';
import { ThemeControlBar } from './components/ThemeControlBar.tsx';
import { FinancialProfileBar } from './components/FinancialProfileBar.tsx';
import { SubsRadarLogo } from './components/SubsRadarLogo.tsx';
import {
  ArrowLeft,
  Cookie,
  Home,
  LogIn,
  Plus,
  RotateCcw,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

type ViewMode = 'home' | 'auth' | 'cookies' | 'dashboard';
type ActiveTab = 'matrix' | 'simulator' | 'parser' | 'action-engine';

interface NavSnapshot {
  viewMode: ViewMode;
  activeTab: ActiveTab;
}

const DEFAULT_HISTORICAL_BURN: HistoricalBurnPoint[] = [
  { month: "Nov '25", subscriptionBurn: 1025.0, targetBurn: 500 },
  { month: "Dec '25", subscriptionBurn: 990.5, targetBurn: 500 },
  { month: "Jan '26", subscriptionBurn: 965.0, targetBurn: 500 },
  { month: "Feb '26", subscriptionBurn: 920.0, targetBurn: 500 },
  { month: "Mar '26", subscriptionBurn: 895.5, targetBurn: 500 },
  { month: "Apr '26", subscriptionBurn: 860.0, targetBurn: 500 },
  { month: "May '26", subscriptionBurn: 835.0, targetBurn: 500 },
  { month: "Jun '26", subscriptionBurn: 810.0, targetBurn: 500 },
  { month: "Jul '26", subscriptionBurn: 798.5, targetBurn: 500 },
  { month: "Aug '26", subscriptionBurn: 790.0, targetBurn: 500 },
  { month: "Sep '26", subscriptionBurn: 785.0, targetBurn: 500 },
  { month: "Oct '26", subscriptionBurn: 781.87, targetBurn: 500 },
];

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<ActiveTab>('matrix');
  const [navHistory, setNavHistory] = useState<NavSnapshot[]>([]);

  // Global Zoom In / Zoom Out state (80% to 130%)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Theme Configuration: 3 Aesthetic Modes + 6 Color Options + Day/Night Mode
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem('subsradar_theme_config');
      if (saved) return JSON.parse(saved) as ThemeConfig;
    } catch {
      // ignore parse error
    }
    return {
      aestheticMode: 'luxury',
      dayNight: 'day',
      colorOption: 'gold',
    };
  });

  const styles = useMemo(() => getComputedTheme(themeConfig), [themeConfig]);

  const navigateTo = (nextView: ViewMode, nextTab: ActiveTab = activeTab) => {
    if (nextView === viewMode && nextTab === activeTab) return;
    setNavHistory((prev) => [...prev.slice(-15), { viewMode, activeTab }]);
    setViewMode(nextView);
    setActiveTab(nextTab);
  };

  const handleGoBack = () => {
    if (navHistory.length > 0) {
      const last = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setViewMode(last.viewMode);
      setActiveTab(last.activeTab);
    } else if (viewMode !== 'home') {
      setViewMode('home');
    }
  };

  const handleChangeTheme = (updates: Partial<ThemeConfig>) => {
    setThemeConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('subsradar_theme_config', JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([
    'AI & Compute',
    'Home Automation',
  ]);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // JWT Auth & User Financial Profile state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(() =>
    localStorage.getItem('subsradar_jwt_token')
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // What-If Simulator state (IDs toggled off)
  const [canceledIds, setCanceledIds] = useState<string[]>([
    'sub_equinox',
    'sub_adobe_cc',
    'sub_linkedin_sales',
    'sub_bloomberg_terminal',
  ]);

  // Modal states
  const [aiModalSub, setAiModalSub] = useState<Subscription | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isParserModalOpen, setIsParserModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const getAuthHeaders = (overrideToken?: string | null): Record<string, string> => {
    const activeToken = overrideToken !== undefined ? overrideToken : jwtToken;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (activeToken) {
      headers.Authorization = `Bearer ${activeToken}`;
    }
    return headers;
  };

  const fetchAllData = async (tokenOverride?: string | null) => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders(tokenOverride);
      const res = await fetch('/api/subscriptions', { headers });
      if (res.ok) {
        const data = await res.json();
        const subs: Subscription[] = data.subscriptions || [];
        setSubscriptions(subs);
        setSavedScenarios(data.savedScenarios || []);
        if (Array.isArray(data.customCategories)) {
          setCustomCategories(data.customCategories);
        }
        if (data.user) {
          setCurrentUser(data.user);
        }
        if (data.defaultToken && !localStorage.getItem('subsradar_jwt_token') && !tokenOverride) {
          localStorage.setItem('subsradar_jwt_token', data.defaultToken);
          setJwtToken(data.defaultToken);
        }
        if (subs.length > 0) {
          setSelectedSubId(subs[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAuthSuccess = async (token: string, user: User) => {
    localStorage.setItem('subsradar_jwt_token', token);
    setJwtToken(token);
    setCurrentUser(user);
    await fetchAllData(token);
    setIsAuthModalOpen(false);
    navigateTo('cookies', 'matrix');
  };

  const handleAuthPageComplete = async (
    token: string,
    user: User,
    manualSubscriptions?: Array<{
      name: string;
      category: SubscriptionCategory;
      monthlyCost: string;
      billingCycle: BillingCycle;
      usageFrequency: number;
    }>
  ) => {
    localStorage.setItem('subsradar_jwt_token', token);
    setJwtToken(token);
    setCurrentUser(user);

    if (manualSubscriptions && manualSubscriptions.length > 0) {
      for (const draft of manualSubscriptions) {
        if (!draft.name.trim()) continue;
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({
            name: draft.name.trim(),
            category: draft.category,
            monthlyCost: parseFloat(draft.monthlyCost) || 0,
            billingCycle: draft.billingCycle,
            usageFrequency: draft.usageFrequency,
            status: 'ACTIVE',
            renewalDate: new Date(Date.now() + 14 * 86400000).toISOString(),
          }),
        });
      }
    }

    await fetchAllData(token);
    // Route to Accept / Reject Cookies Page upon logging in / signing up
    navigateTo('cookies', 'matrix');
  };

  const handleCookiesDecision = (decision: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem('subsradar_cookies_consent', decision);
    } catch {
      // ignore storage error
    }
    navigateTo('dashboard', 'matrix');
  };

  const handleLogout = () => {
    localStorage.removeItem('subsradar_jwt_token');
    setJwtToken(null);
    setCurrentUser(null);
    navigateTo('home');
  };

  const handleUpdateFinancialProfile = async (updates: Partial<UserFinancialProfile>) => {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.financialProfile) {
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  financialProfile: data.financialProfile,
                }
              : prev
          );
        }
      }
    } catch (error) {
      console.error('Error updating financial profile:', error);
    }
  };

  const handleCreateCustomCategory = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setCustomCategories((prev) =>
      prev.includes(clean) ? prev : [...prev, clean]
    );
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.customCategories)) {
          setCustomCategories(data.customCategories);
        }
      }
    } catch (error) {
      console.error('Error creating custom category:', error);
    }
  };

  const handleUpdateSubscription = async (
    id: string,
    updates: Partial<Subscription>
  ) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = (await res.json()) as Subscription;
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        );
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    if (selectedSubId === id) {
      const remaining = subscriptions.filter((s) => s.id !== id);
      setSelectedSubId(remaining[0]?.id || null);
    }
    try {
      await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const handleCreateSubscription = async (input: {
    name: string;
    category: SubscriptionCategory;
    customCategory?: string;
    monthlyCost: number;
    billingCycle: BillingCycle;
    renewalDate: string;
    usageFrequency: number;
    status: SubscriptionStatus;
    cancellationUrl?: string;
  }) => {
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const created = (await res.json()) as Subscription;
      setSubscriptions((prev) => [created, ...prev]);
      setSelectedSubId(created.id);
    }
  };

  const handleBatchImport = async (items: ParsedStatementItem[]) => {
    const res = await fetch('/api/subscriptions/batch', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.created)) {
        setSubscriptions((prev) => [...data.created, ...prev]);
        if (data.created[0]) {
          setSelectedSubId(data.created[0].id);
        }
        navigateTo('dashboard', 'matrix');
      }
    }
  };

  const handleSaveScenario = async (payload: {
    name: string;
    targetSavings: number;
    canceledSubscriptionIds: string[];
    annualROI: number;
  }) => {
    const res = await fetch('/api/scenarios', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = (await res.json()) as SavedScenario;
      setSavedScenarios((prev) => [created, ...prev]);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    setSavedScenarios((prev) => prev.filter((sc) => sc.id !== id));
    await fetch(`/api/scenarios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  };

  const handleResetDemoData = async () => {
    const res = await fetch('/api/subscriptions/reset', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const state = await res.json();
      setSubscriptions(state.subscriptions || []);
      setSavedScenarios(state.savedScenarios || []);
      if (state.user) {
        setCurrentUser(state.user);
      }
      if (Array.isArray(state.customCategories)) {
        setCustomCategories(state.customCategories);
      }
      setSelectedSubId(state.subscriptions?.[0]?.id || null);
    }
  };

  const summaryStats = useMemo(() => {
    const active = subscriptions.filter((s) => s.status !== 'CANCELED');
    const monthlyBurn = active.reduce((sum, s) => sum + s.monthlyCost, 0);
    const annualBurn = monthlyBurn * 12;

    const leakSubs = active.filter((s) => {
      const q = getQuadrant(s.monthlyCost, s.usageFrequency).id;
      return q === 'DANGER_ZONE' || q === 'SILENT_LEAKS';
    });
    const potentialMonthlySavings = leakSubs.reduce((sum, s) => sum + s.monthlyCost, 0);

    const r = 0.07 / 12;
    const fiveYearCompound =
      potentialMonthlySavings > 0
        ? potentialMonthlySavings * ((Math.pow(1 + r, 60) - 1) / r)
        : 0;

    return {
      activeCount: active.length,
      monthlyBurn,
      annualBurn,
      leakCount: leakSubs.length,
      potentialMonthlySavings,
      fiveYearCompound,
    };
  }, [subscriptions]);

  const activeFinancialProfile: UserFinancialProfile = useMemo(() => {
    if (currentUser?.financialProfile) {
      return currentUser.financialProfile;
    }
    return {
      totalEarnings: 9200,
      monthlyExpenditure: 4350,
      monthlySavingGoal: 2200,
      historicalBurn: DEFAULT_HISTORICAL_BURN,
    };
  }, [currentUser]);

  const selectedSub = useMemo(
    () => subscriptions.find((s) => s.id === selectedSubId) || subscriptions[0] || null,
    [subscriptions, selectedSubId]
  );

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${styles.pageBgClass}`}>
      {/* Top Bar with Logo, Navigation, Back Button & Zoom Controls */}
      <header
        className={`flex items-center justify-between px-5 py-3.5 border-b backdrop-blur-md sticky top-0 z-30 transition-colors duration-200 ${styles.headerBgClass}`}
      >
        {/* Zone 1: Back Button + Custom App Logo & App Name */}
        <div className="flex items-center gap-3">
          {(viewMode !== 'home' || navHistory.length > 0) && (
            <button
              type="button"
              onClick={handleGoBack}
              className={`px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer ${styles.subPanelClass}`}
              title="Go Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
            }}
            className="whitespace-nowrap"
          >
            <SubsRadarLogo
              accentHex={styles.accentHex}
              headingFontClass={styles.headingFontClass}
              size="md"
            />
          </a>
        </div>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav className={`hidden md:flex items-center gap-5 text-xs font-semibold ${styles.mutedTextClass}`}>
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
            }}
            style={
              viewMode === 'home'
                ? { color: styles.accentHex, textDecorationColor: styles.accentHex }
                : undefined
            }
            className={`py-1 transition-colors whitespace-nowrap ${
              viewMode === 'home'
                ? 'underline underline-offset-8 decoration-2'
                : 'hover:opacity-100'
            }`}
          >
            Home
          </a>

          <a
            href="#matrix"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('dashboard', 'matrix');
            }}
            style={
              viewMode === 'dashboard' && activeTab === 'matrix'
                ? { color: styles.accentHex, textDecorationColor: styles.accentHex }
                : undefined
            }
            className={`py-1 transition-colors whitespace-nowrap ${
              viewMode === 'dashboard' && activeTab === 'matrix'
                ? 'underline underline-offset-8 decoration-2'
                : 'hover:opacity-100'
            }`}
          >
            Matrix &amp; Ledger
          </a>

          <a
            href="#simulator"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('dashboard', 'simulator');
            }}
            style={
              viewMode === 'dashboard' && activeTab === 'simulator'
                ? { color: styles.accentHex, textDecorationColor: styles.accentHex }
                : undefined
            }
            className={`py-1 transition-colors whitespace-nowrap ${
              viewMode === 'dashboard' && activeTab === 'simulator'
                ? 'underline underline-offset-8 decoration-2'
                : 'hover:opacity-100'
            }`}
          >
            What-If Simulator
          </a>

          <a
            href="#parser"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('dashboard', 'parser');
            }}
            style={
              viewMode === 'dashboard' && activeTab === 'parser'
                ? { color: styles.accentHex, textDecorationColor: styles.accentHex }
                : undefined
            }
            className={`py-1 transition-colors whitespace-nowrap ${
              viewMode === 'dashboard' && activeTab === 'parser'
                ? 'underline underline-offset-8 decoration-2'
                : 'hover:opacity-100'
            }`}
          >
            Statement Parser
          </a>

          <a
            href="#action-engine"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('dashboard', 'action-engine');
            }}
            style={
              viewMode === 'dashboard' && activeTab === 'action-engine'
                ? { color: styles.accentHex, textDecorationColor: styles.accentHex }
                : undefined
            }
            className={`py-1 transition-colors whitespace-nowrap ${
              viewMode === 'dashboard' && activeTab === 'action-engine'
                ? 'underline underline-offset-8 decoration-2'
                : 'hover:opacity-100'
            }`}
          >
            AI Action Engine
          </a>
        </nav>

        {/* Zone 3: Zoom Controls + Primary Actions */}
        <div className="flex items-center gap-2">
          <div className={`hidden sm:flex items-center gap-0.5 px-2 py-1 ${styles.subPanelClass} text-xs`}>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
              className="p-0.5 hover:opacity-80 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="px-1 font-mono text-[11px] font-semibold cursor-pointer"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-0.5 hover:opacity-80 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {viewMode === 'home' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setAuthInitialMode('login');
                  navigateTo('auth');
                }}
                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${styles.subPanelClass}`}
              >
                <LogIn className="w-3.5 h-3.5" style={{ color: styles.accentHex }} />
                {currentUser ? currentUser.name : 'Sign In / Sign Up'}
              </button>
              <button
                type="button"
                onClick={() => navigateTo('dashboard', 'matrix')}
                style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap"
              >
                Open Workspace
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${styles.subPanelClass}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: styles.accentHex }} />
                {currentUser ? currentUser.name : 'Account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateTo('dashboard', activeTab);
                  setIsAddModalOpen(true);
                }}
                style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Sub
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div
        className={`md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-b text-xs font-medium ${styles.headerBgClass}`}
      >
        <button
          type="button"
          onClick={() => navigateTo('home')}
          style={
            viewMode === 'home'
              ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
              : undefined
          }
          className="px-3 py-1 rounded-md whitespace-nowrap flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </button>
        {(
          [
            ['matrix', 'Matrix & Ledger'],
            ['simulator', 'What-If Simulator'],
            ['parser', 'Statement Parser'],
            ['action-engine', 'AI Action Engine'],
          ] as [ActiveTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => navigateTo('dashboard', key)}
            style={
              viewMode === 'dashboard' && activeTab === key
                ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                : undefined
            }
            className="px-3 py-1 rounded-md whitespace-nowrap"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Container with Zoom Scaling */}
      <main
        style={{ zoom: `${zoomLevel}%` }}
        className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5"
      >
        {viewMode === 'home' && (
          <HomePage
            themeConfig={themeConfig}
            styles={styles}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onChangeTheme={handleChangeTheme}
            onNavigateAuth={(mode) => {
              setAuthInitialMode(mode);
              navigateTo('auth');
            }}
            onEnterDemoDashboard={() => navigateTo('dashboard', 'matrix')}
          />
        )}

        {viewMode === 'auth' && (
          <AuthPage
            initialMode={authInitialMode}
            themeConfig={themeConfig}
            styles={styles}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onChangeTheme={handleChangeTheme}
            onBackHome={handleGoBack}
            onAuthComplete={handleAuthPageComplete}
          />
        )}

        {viewMode === 'cookies' && (
          <CookiesConsentPage
            userName={currentUser?.name}
            themeConfig={themeConfig}
            styles={styles}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onChangeTheme={handleChangeTheme}
            onBack={handleGoBack}
            onAcceptCookies={() => handleCookiesDecision('accepted')}
            onRejectCookies={() => handleCookiesDecision('rejected')}
          />
        )}

        {viewMode === 'dashboard' && (
          <>
            {/* Theme, Color, Day/Night & Zoom Switcher */}
            <ThemeControlBar
              themeConfig={themeConfig}
              styles={styles}
              onChangeTheme={handleChangeTheme}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
            />

            {/* User Personal Financial Profile & Monthly Saving Goals */}
            <FinancialProfileBar
              userName={currentUser?.name || 'Alex Mercer'}
              profile={activeFinancialProfile}
              activeSubscriptionBurn={summaryStats.monthlyBurn}
              styles={styles}
              onSaveProfile={handleUpdateFinancialProfile}
            />

            {/* Executive Subscription Burn Strip (Main Titles & Figures Only) */}
            <section className={`${styles.cardClass} p-4 transition-colors duration-200`}>
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x ${styles.dividerClass}`}
              >
                <div className="pr-4 py-1.5 sm:py-0">
                  <div className={`text-xs ${styles.mutedTextClass}`}>
                    Active Monthly Burn
                  </div>
                  <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums">
                    ${summaryStats.monthlyBurn.toFixed(2)}
                    <span className={`text-xs font-normal ${styles.mutedTextClass}`}>/mo</span>
                  </div>
                </div>

                <div className="sm:px-4 py-1.5 sm:py-0">
                  <div className={`text-xs ${styles.mutedTextClass}`}>
                    Annualized Run-Rate
                  </div>
                  <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums">
                    ${summaryStats.annualBurn.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    <span className={`text-xs font-normal ${styles.mutedTextClass}`}>/yr</span>
                  </div>
                </div>

                <div className="sm:px-4 py-1.5 sm:py-0">
                  <div className="text-xs text-red-600 font-medium">
                    Recoverable Leakage
                  </div>
                  <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-red-600">
                    ${summaryStats.potentialMonthlySavings.toFixed(2)}
                    <span className={`text-xs font-normal ${styles.mutedTextClass}`}>/mo</span>
                  </div>
                </div>

                <div className="sm:pl-4 py-1.5 sm:py-0">
                  <div className="text-xs text-emerald-600 font-medium">
                    5-Year Compound Opportunity
                  </div>
                  <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-emerald-600">
                    +${summaryStats.fiveYearCompound.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Loading State */}
            {isLoading ? (
              <div className={`${styles.cardClass} p-10 text-center space-y-3`}>
                <div className="text-sm font-medium">Loading Ledger...</div>
                <div className="w-40 h-1.5 bg-slate-500/20 rounded-full mx-auto overflow-hidden">
                  <div
                    className="w-1/2 h-full animate-pulse"
                    style={{ backgroundColor: styles.accentHex }}
                  />
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'matrix' && (
                  <CostVsUsageMatrix
                    subscriptions={subscriptions}
                    customCategories={customCategories}
                    selectedSubId={selectedSub?.id || null}
                    styles={styles}
                    onBack={handleGoBack}
                    onSelectSub={(sub) => setSelectedSubId(sub ? sub.id : null)}
                    onUpdateSub={handleUpdateSubscription}
                    onDeleteSub={handleDeleteSubscription}
                    onCreateCustomCategory={handleCreateCustomCategory}
                    onOpenAiModal={(sub) => {
                      setAiModalSub(sub);
                      setIsAiModalOpen(true);
                    }}
                    onSimulateCut={(subId) => {
                      setCanceledIds((prev) =>
                        prev.includes(subId) ? prev : [...prev, subId]
                      );
                      navigateTo('dashboard', 'simulator');
                    }}
                  />
                )}

                {activeTab === 'simulator' && (
                  <SavingsSimulator
                    subscriptions={subscriptions}
                    canceledIds={canceledIds}
                    historicalBurn={
                      activeFinancialProfile.historicalBurn || DEFAULT_HISTORICAL_BURN
                    }
                    monthlySavingGoal={activeFinancialProfile.monthlySavingGoal}
                    styles={styles}
                    onBack={() => navigateTo('dashboard', 'matrix')}
                    onToggleCut={(subId) =>
                      setCanceledIds((prev) =>
                        prev.includes(subId)
                          ? prev.filter((id) => id !== subId)
                          : [...prev, subId]
                      )
                    }
                    onSetCanceledIds={setCanceledIds}
                    onUpdateHistoricalBurn={async (updatedHistory) => {
                      await handleUpdateFinancialProfile({
                        historicalBurn: updatedHistory,
                      });
                    }}
                    savedScenarios={savedScenarios}
                    onSaveScenario={handleSaveScenario}
                    onDeleteScenario={handleDeleteScenario}
                    onOpenAiModal={(sub) => {
                      setAiModalSub(sub);
                      setIsAiModalOpen(true);
                    }}
                  />
                )}

                {activeTab === 'parser' && (
                  <StatementParserModal
                    isOpen={true}
                    isInline={true}
                    styles={styles}
                    onClose={() => navigateTo('dashboard', 'matrix')}
                    onImportItems={handleBatchImport}
                  />
                )}

                {activeTab === 'action-engine' && (
                  <GemmaActionModal
                    subscription={aiModalSub || selectedSub}
                    subscriptions={subscriptions}
                    isOpen={true}
                    isInline={true}
                    styles={styles}
                    onClose={() => navigateTo('dashboard', 'matrix')}
                    onSelectSubscription={(sub) => {
                      setAiModalSub(sub);
                      setSelectedSubId(sub.id);
                    }}
                    onMarkStatus={async (id, status) => {
                      await handleUpdateSubscription(id, { status });
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className={`border-t px-6 py-3.5 mt-8 transition-colors duration-200 ${styles.headerBgClass}`}>
        <div
          className={`max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${styles.mutedTextClass}`}
        >
          <SubsRadarLogo
            accentHex={styles.accentHex}
            headingFontClass={styles.headingFontClass}
            size="sm"
          />
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigateTo('cookies')}
              className="hover:opacity-100 flex items-center gap-1 transition-opacity cursor-pointer"
            >
              <Cookie className="w-3.5 h-3.5" />
              Cookie Preferences &amp; Terms
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthInitialMode('register');
                navigateTo('auth');
              }}
              className="hover:opacity-100 transition-opacity cursor-pointer"
            >
              Sign Up / Goals
            </button>
            <button
              type="button"
              onClick={() => setIsParserModalOpen(true)}
              className="hover:opacity-100 transition-opacity cursor-pointer"
            >
              Statement CSV
            </button>
            <button
              type="button"
              onClick={handleResetDemoData}
              className="hover:opacity-100 flex items-center gap-1 transition-opacity cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Ledger
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Overlays */}
      <GemmaActionModal
        subscription={aiModalSub || selectedSub}
        subscriptions={subscriptions}
        isOpen={isAiModalOpen}
        styles={styles}
        onClose={() => setIsAiModalOpen(false)}
        onMarkStatus={async (id, status) => {
          await handleUpdateSubscription(id, { status });
        }}
      />

      <StatementParserModal
        isOpen={isParserModalOpen}
        styles={styles}
        onClose={() => setIsParserModalOpen(false)}
        onImportItems={handleBatchImport}
      />

      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        customCategories={customCategories}
        styles={styles}
        onClose={() => setIsAddModalOpen(false)}
        onCreateCustomCategory={handleCreateCustomCategory}
        onCreate={handleCreateSubscription}
      />

      <AuthAccountModal
        isOpen={isAuthModalOpen}
        styles={styles}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        token={jwtToken}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}
