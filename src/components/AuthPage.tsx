import React, { useState } from 'react';
import { User } from '../types/subscription.ts';
import { ComputedThemeStyles, ThemeConfig } from '../types/theme.ts';
import { ThemeControlBar } from './ThemeControlBar.tsx';
import { SubsRadarLogo } from './SubsRadarLogo.tsx';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';

interface AuthPageProps {
  initialMode: 'login' | 'register';
  themeConfig: ThemeConfig;
  styles: ComputedThemeStyles;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onChangeTheme: (updates: Partial<ThemeConfig>) => void;
  onBackHome: () => void;
  onAuthComplete: (
    token: string,
    user: User,
    authMode: 'login' | 'register'
  ) => Promise<void>;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode,
  themeConfig,
  styles,
  zoomLevel,
  onZoomChange,
  onChangeTheme,
  onBackHome,
  onAuthComplete,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(
    initialMode === 'login' ? 'alex.mercer@workspace.local' : ''
  );
  const [password, setPassword] = useState(
    initialMode === 'login' ? 'RadarPass2026!' : ''
  );
  const [seedStarterSubscriptions, setSeedStarterSubscriptions] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Invalid login credentials.');
          return;
        }
        await onAuthComplete(data.token, data.user, 'login');
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || email.split('@')[0],
            email: email.trim(),
            password,
            seedStarterSubscriptions,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Registration failed.');
          return;
        }
        await onAuthComplete(data.token, data.user, 'register');
      }
    } catch {
      setErrorMsg('Network error communicating with authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackHome}
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

      <div className="max-w-xl mx-auto">
        <div className={`${styles.cardClass} overflow-hidden`}>
          {/* Mode Switcher Tabs */}
          <div className={`grid grid-cols-2 border-b ${styles.dividerClass}`}>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              style={
                mode === 'login'
                  ? { borderBottom: `3px solid ${styles.accentHex}` }
                  : undefined
              }
              className={`py-4 px-6 text-sm font-bold text-center transition-colors cursor-pointer ${
                mode === 'login' ? '' : styles.mutedTextClass
              }`}
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              style={
                mode === 'register'
                  ? { borderBottom: `3px solid ${styles.accentHex}` }
                  : undefined
              }
              className={`py-4 px-6 text-sm font-bold text-center transition-colors cursor-pointer ${
                mode === 'register' ? '' : styles.mutedTextClass
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 rounded-lg font-medium">
                {errorMsg}
              </div>
            )}

            {mode === 'login' && (
              <div className={`${styles.subPanelClass} p-3.5 flex flex-wrap items-center justify-between gap-2`}>
                <span className="font-mono text-[11px]">
                  Demo: alex.mercer@workspace.local · RadarPass2026!
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('alex.mercer@workspace.local');
                    setPassword('RadarPass2026!');
                  }}
                  style={{ color: styles.accentHex }}
                  className="text-xs font-semibold underline cursor-pointer"
                >
                  Auto-Fill Demo
                </button>
              </div>
            )}

            <div className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block font-semibold mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Riddhi Ghosh"
                    className={`w-full px-3.5 py-2 border ${styles.inputClass} focus:outline-none`}
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className={`w-full px-3.5 py-2 border ${styles.inputClass} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5">Password (min 6 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2 border ${styles.inputClass} focus:outline-none`}
                />
              </div>

              {mode === 'register' && (
                <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={seedStarterSubscriptions}
                    onChange={(e) => setSeedStarterSubscriptions(e.target.checked)}
                    className="accent-current"
                  />
                  <span>Include starter quadrant examples</span>
                </label>
              )}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                className="w-full py-3 px-6 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                {mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    {isSubmitting ? 'Authenticating...' : 'Continue to Cookie Notice'}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {isSubmitting
                      ? 'Creating Account...'
                      : 'Sign Up & Continue to Cookie Notice'}
                  </>
                )}
              </button>
            </div>

            {/* Unnoticeable Plain-Text Terms & Conditions in Colorful, Difficult Vocabulary */}
            <p className={`text-[9px] leading-tight font-normal select-none opacity-25 pt-2 ${styles.mutedTextClass}`}>
              Terms and Conditions: Notwithstanding any antecedent assurances of cryptographic fortification, should this digital edifice suffer clandestine cybernetic incursion, nefarious algorithmic subornation, or unauthorized packet depredation by malfeasant third-party actors (to wit, should the platform be hacked), the Proprietors and Corporate Entity wholly abjure, disavow, and indemnify themselves from all fiduciary or pecuniary responsibility for any resultant dissipation, compromise, or loss of personal data.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
