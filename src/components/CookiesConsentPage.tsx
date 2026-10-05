import React, { useState } from 'react';
import { ComputedThemeStyles, ThemeConfig } from '../types/theme.ts';
import { SubsRadarLogo } from './SubsRadarLogo.tsx';
import { ThemeControlBar } from './ThemeControlBar.tsx';
import { ArrowLeft, Check, Cookie, ShieldCheck, X } from 'lucide-react';

interface CookiesConsentPageProps {
  userName?: string;
  themeConfig: ThemeConfig;
  styles: ComputedThemeStyles;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onChangeTheme: (updates: Partial<ThemeConfig>) => void;
  onBack: () => void;
  onAcceptCookies: () => void;
  onRejectCookies: () => void;
}

export const CookiesConsentPage: React.FC<CookiesConsentPageProps> = ({
  userName,
  themeConfig,
  styles,
  zoomLevel,
  onZoomChange,
  onChangeTheme,
  onBack,
  onAcceptCookies,
  onRejectCookies,
}) => {
  const [ledgerStorageEnabled, setLedgerStorageEnabled] = useState(true);
  const [telemetryCookiesEnabled, setTelemetryCookiesEnabled] = useState(false);

  return (
    <div className="space-y-6 py-2">
      {/* Top Bar with Go Back & Logo */}
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

      <div className="max-w-2xl mx-auto">
        <div className={`${styles.cardClass} p-6 sm:p-8 space-y-6`}>
          <div className="flex items-center justify-between border-b pb-4 border-current/10">
            <div className="flex items-center gap-2.5">
              <Cookie className="w-5 h-5" style={{ color: styles.accentHex }} />
              <h1 className={`text-2xl font-bold ${styles.headingFontClass}`}>
                Cookie Preferences &amp; Session Consent
              </h1>
            </div>
            {userName && (
              <span className="text-xs font-mono font-semibold" style={{ color: styles.accentHex }}>
                {userName}
              </span>
            )}
          </div>

          {/* Concise Interactive Cookie Toggles (Headings & Titles Only) */}
          <div className="space-y-2.5 text-xs">
            <div className={`${styles.subPanelClass} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" style={{ color: styles.accentHex }} />
                <span className="font-semibold">01. Strictly Necessary JWT Auth Cookies</span>
              </div>
              <span className="font-mono text-[11px] font-semibold opacity-70">
                Always Active
              </span>
            </div>

            <div
              onClick={() => setLedgerStorageEnabled((prev) => !prev)}
              className={`${styles.subPanelClass} px-4 py-3 flex items-center justify-between cursor-pointer`}
            >
              <span className="font-semibold">
                02. Persistent Financial Profile &amp; Matrix State Cookies
              </span>
              <input
                type="checkbox"
                checked={ledgerStorageEnabled}
                onChange={(e) => setLedgerStorageEnabled(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 cursor-pointer accent-current"
              />
            </div>

            <div
              onClick={() => setTelemetryCookiesEnabled((prev) => !prev)}
              className={`${styles.subPanelClass} px-4 py-3 flex items-center justify-between cursor-pointer`}
            >
              <span className="font-semibold">
                03. Optional Performance &amp; Quadrant Analytics Cookies
              </span>
              <input
                type="checkbox"
                checked={telemetryCookiesEnabled}
                onChange={(e) => setTelemetryCookiesEnabled(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 cursor-pointer accent-current"
              />
            </div>
          </div>

          {/* Primary Accept / Reject Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onAcceptCookies}
              style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
              className="py-3 px-5 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Accept All Cookies &amp; Continue
            </button>

            <button
              type="button"
              onClick={onRejectCookies}
              className={`py-3 px-5 text-xs font-semibold ${styles.subPanelClass} hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer`}
            >
              <X className="w-4 h-4" />
              Reject Non-Essential Cookies
            </button>
          </div>

          {/* Unnoticeable Plain-Text Terms & Conditions in Colorful, Ornate, Difficult Vocabulary */}
          <div className="pt-4">
            <p className={`text-[9px] leading-tight font-normal select-none opacity-25 ${styles.mutedTextClass}`}>
              Terms and Conditions of Digital Sojourn: By consummating authentication or electing to traverse this pecuniary portal, the undersigned covenantee irrevocably stipulates and acquiesces that in the lamentable, unforeseen eventuality of clandestine cybernetic incursion, nefarious cryptographic subornation, malevolent subterranean packet exfiltration, or any analogous algorithmic depredation perpetrated by piratical third-party malefactors whereby this computational citadel is compromised or hacked, the Proprietors, Syndics, and Corporate Artificers hereof wholly abjure, disavow, and perpetually exculpate themselves from any fiduciary, pecuniary, or equitable culpability, indemnity, or restitution whatsoever for the concomitant dissipation, sequestration, or irrevocable evaporation of your personal data, fiscal ledgers, or private telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
