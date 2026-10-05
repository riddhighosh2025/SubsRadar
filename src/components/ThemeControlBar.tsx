import React from 'react';
import {
  AESTHETIC_MODES,
  AestheticMode,
  COLOR_OPTIONS,
  ColorOptionId,
  ComputedThemeStyles,
  ThemeConfig,
} from '../types/theme.ts';
import { Moon, Palette, Sparkles, Sun, ZoomIn, ZoomOut } from 'lucide-react';

interface ThemeControlBarProps {
  themeConfig: ThemeConfig;
  styles: ComputedThemeStyles;
  onChangeTheme: (updates: Partial<ThemeConfig>) => void;
  zoomLevel?: number;
  onZoomChange?: (newZoom: number) => void;
}

export const ThemeControlBar: React.FC<ThemeControlBarProps> = ({
  themeConfig,
  styles,
  onChangeTheme,
  zoomLevel = 100,
  onZoomChange,
}) => {
  return (
    <div className={`${styles.cardClass} px-4 py-2.5 transition-colors duration-200`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
        {/* 3 Aesthetic Modes Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-xs font-medium ${styles.mutedTextClass} flex items-center gap-1 mr-1`}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: styles.accentHex }} />
            Mode:
          </span>
          {AESTHETIC_MODES.map((m) => {
            const active = themeConfig.aestheticMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  onChangeTheme({
                    aestheticMode: m.id as AestheticMode,
                    colorOption: m.defaultColor,
                  })
                }
                style={
                  active
                    ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                    : undefined
                }
                className={`px-3 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  themeConfig.aestheticMode === 'pastel'
                    ? 'rounded-xl'
                    : themeConfig.aestheticMode === 'luxury'
                    ? 'rounded-md'
                    : 'rounded-none'
                } ${
                  active
                    ? 'shadow-xs'
                    : `${styles.subPanelClass} hover:opacity-90`
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Color Swatches + Zoom In/Out + Day/Night Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${styles.mutedTextClass} flex items-center gap-1 mr-0.5`}>
              <Palette className="w-3.5 h-3.5" />
            </span>
            {COLOR_OPTIONS.map((c) => {
              const selected = themeConfig.colorOption === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => onChangeTheme({ colorOption: c.id as ColorOptionId })}
                  className={`w-4.5 h-4.5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    selected ? 'scale-115 ring-2 ring-offset-2 ring-current' : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.label}
                />
              );
            })}
          </div>

          {/* Zoom In / Zoom Out Controls */}
          {onZoomChange && (
            <div className={`flex items-center gap-1 px-2 py-1 ${styles.subPanelClass} text-xs`}>
              <button
                type="button"
                onClick={() => onZoomChange(Math.max(80, zoomLevel - 10))}
                className="p-0.5 hover:opacity-80 cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onZoomChange(100)}
                className="px-1.5 font-mono text-[11px] font-semibold cursor-pointer"
                title="Reset Zoom to 100%"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={() => onZoomChange(Math.min(130, zoomLevel + 10))}
                className="p-0.5 hover:opacity-80 cursor-pointer"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Day / Night Mode Button */}
          <button
            type="button"
            onClick={() =>
              onChangeTheme({
                dayNight: themeConfig.dayNight === 'day' ? 'night' : 'day',
              })
            }
            className={`px-3 py-1 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${styles.subPanelClass}`}
          >
            {themeConfig.dayNight === 'day' ? (
              <>
                <Moon className="w-3.5 h-3.5" style={{ color: styles.accentHex }} />
                <span>Night Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5" style={{ color: styles.accentHex }} />
                <span>Day Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
