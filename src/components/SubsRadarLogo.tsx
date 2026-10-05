import React from 'react';

interface SubsRadarLogoProps {
  accentHex: string;
  headingFontClass?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SubsRadarLogo: React.FC<SubsRadarLogoProps> = ({
  accentHex,
  headingFontClass = '',
  size = 'md',
}) => {
  const iconDimensions =
    size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const textSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDimensions} shrink-0`}
        aria-hidden="true"
      >
        {/* Outer Radar Ring */}
        <circle
          cx="18"
          cy="18"
          r="15.5"
          stroke={accentHex}
          strokeWidth="2"
          strokeOpacity="0.85"
        />
        {/* Inner Radar Orbit */}
        <circle
          cx="18"
          cy="18"
          r="9.5"
          stroke={accentHex}
          strokeWidth="1.5"
          strokeDasharray="3 2.5"
          strokeOpacity="0.65"
        />
        {/* Quadrant Crosshairs */}
        <line
          x1="18"
          y1="2.5"
          x2="18"
          y2="33.5"
          stroke={accentHex}
          strokeWidth="1.2"
          strokeOpacity="0.3"
        />
        <line
          x1="2.5"
          y1="18"
          x2="33.5"
          y2="18"
          stroke={accentHex}
          strokeWidth="1.2"
          strokeOpacity="0.3"
        />
        {/* Radar Sweep Sector */}
        <path
          d="M18 18L29 7.5A15.5 15.5 0 0 1 33.5 18H18Z"
          fill={accentHex}
          fillOpacity="0.22"
        />
        {/* Radar Sweep Needle */}
        <line
          x1="18"
          y1="18"
          x2="28.8"
          y2="7.2"
          stroke={accentHex}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Detected Subscription Blip Nodes */}
        <circle cx="25.5" cy="11.5" r="2.4" fill={accentHex} />
        <circle cx="12" cy="13" r="1.8" fill="#EF4444" />
        <circle cx="18" cy="18" r="2.6" fill={accentHex} />
      </svg>
      <span className={`${textSize} font-bold tracking-tight ${headingFontClass}`}>
        SubsRadar
      </span>
    </span>
  );
};
