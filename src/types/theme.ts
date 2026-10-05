export type AestheticMode = 'pastel' | 'luxury' | 'futuristic';
export type DayNightMode = 'day' | 'night';
export type ColorOptionId = 'rose' | 'gold' | 'emerald' | 'violet' | 'cobalt' | 'teal';

export interface ThemeConfig {
  aestheticMode: AestheticMode;
  dayNight: DayNightMode;
  colorOption: ColorOptionId;
}

export const AESTHETIC_MODES: Array<{
  id: AestheticMode;
  name: string;
  tagline: string;
  defaultColor: ColorOptionId;
}> = [
  {
    id: 'pastel',
    name: 'Flowery Pastel Polite',
    tagline: 'Gentle botanical tones, polite guidance & warm editorial serenity',
    defaultColor: 'rose',
  },
  {
    id: 'luxury',
    name: 'Bold, Luxurious, Rich',
    tagline: 'Sovereign private-wealth contrast, architectural lines & rich metallic accents',
    defaultColor: 'gold',
  },
  {
    id: 'futuristic',
    name: 'Futuristic, Edgy, Abstract',
    tagline: 'Kinetic vector geometry, sharp precision & high-contrast telemetry',
    defaultColor: 'cobalt',
  },
];

export const COLOR_OPTIONS: Array<{
  id: ColorOptionId;
  label: string;
  hex: string;
  darkHex: string;
  softDayBg: string;
  softNightBg: string;
}> = [
  {
    id: 'rose',
    label: 'Peony Rose / Ruby',
    hex: '#E11D48',
    darkHex: '#FB7185',
    softDayBg: '#FFF1F2',
    softNightBg: 'rgba(225, 29, 72, 0.16)',
  },
  {
    id: 'gold',
    label: 'Sovereign Gold / Amber',
    hex: '#D97706',
    darkHex: '#FBBF24',
    softDayBg: '#FFFBEB',
    softNightBg: 'rgba(217, 119, 6, 0.16)',
  },
  {
    id: 'emerald',
    label: 'Matcha Sage / Emerald',
    hex: '#059669',
    darkHex: '#34D399',
    softDayBg: '#ECFDF5',
    softNightBg: 'rgba(5, 150, 105, 0.16)',
  },
  {
    id: 'violet',
    label: 'Wisteria / Ultraviolet',
    hex: '#7C3AED',
    darkHex: '#A78BFA',
    softDayBg: '#F5F3FF',
    softNightBg: 'rgba(124, 58, 237, 0.16)',
  },
  {
    id: 'cobalt',
    label: 'Sky Petal / Electric Cobalt',
    hex: '#2563EB',
    darkHex: '#60A5FA',
    softDayBg: '#EFF6FF',
    softNightBg: 'rgba(37, 99, 235, 0.16)',
  },
  {
    id: 'teal',
    label: 'Botanical Mint / Cyber Teal',
    hex: '#0D9488',
    darkHex: '#2DD4BF',
    softDayBg: '#F0FDFA',
    softNightBg: 'rgba(13, 148, 136, 0.16)',
  },
];

export interface ComputedThemeStyles {
  isNight: boolean;
  accentHex: string;
  accentSoftBg: string;
  pageBgClass: string;
  pageTextClass: string;
  headerBgClass: string;
  cardClass: string;
  subPanelClass: string;
  inputClass: string;
  mutedTextClass: string;
  dividerClass: string;
  headingFontClass: string;
  chartGridStroke: string;
  chartAxisStroke: string;
  chartTooltipBg: string;
  modeBadgeLabel: string;
  politeGreetingPrefix: string;
}

export function getComputedTheme(config: ThemeConfig): ComputedThemeStyles {
  const { aestheticMode, dayNight, colorOption } = config;
  const isNight = dayNight === 'night';
  const colorMeta =
    COLOR_OPTIONS.find((c) => c.id === colorOption) || COLOR_OPTIONS[0];
  const accentHex = isNight ? colorMeta.darkHex : colorMeta.hex;
  const accentSoftBg = isNight ? colorMeta.softNightBg : colorMeta.softDayBg;

  if (aestheticMode === 'pastel') {
    return {
      isNight,
      accentHex,
      accentSoftBg,
      pageBgClass: isNight ? 'bg-[#18131A] text-[#FBF7FA]' : 'bg-[#FDFBF9] text-[#2A2029]',
      pageTextClass: isNight ? 'text-[#FBF7FA]' : 'text-[#2A2029]',
      headerBgClass: isNight
        ? 'bg-[#211A24]/95 border-[#382C3E]'
        : 'bg-[#FFFDFB]/95 border-[#EFE4E8]',
      cardClass: isNight
        ? 'bg-[#221B26] border border-[#392E3F] rounded-2xl'
        : 'bg-white border border-[#EFE4E8] rounded-2xl',
      subPanelClass: isNight
        ? 'bg-[#1B151E] border border-[#332838] rounded-xl'
        : 'bg-[#FAF5F6] border border-[#F2E6EA] rounded-xl',
      inputClass: isNight
        ? 'bg-[#17121A] border-[#3D3044] text-[#FBF7FA] rounded-xl'
        : 'bg-white border-[#E5D4DA] text-[#2A2029] rounded-xl',
      mutedTextClass: isNight ? 'text-[#B9A7B8]' : 'text-[#736170]',
      dividerClass: isNight ? 'divide-[#35293A] border-[#35293A]' : 'divide-[#F0E4E8] border-[#F0E4E8]',
      headingFontClass: 'font-serif-display tracking-normal',
      chartGridStroke: isNight ? '#35293A' : '#F2E6EA',
      chartAxisStroke: isNight ? '#B9A7B8' : '#7D6A79',
      chartTooltipBg: '#251C29',
      modeBadgeLabel: 'Flowery Pastel Polite',
      politeGreetingPrefix: 'Welcome back kindly,',
    };
  }

  if (aestheticMode === 'luxury') {
    return {
      isNight,
      accentHex,
      accentSoftBg,
      pageBgClass: isNight ? 'bg-[#090B10] text-[#F7F4EB]' : 'bg-[#F6F4EF] text-[#121316]',
      pageTextClass: isNight ? 'text-[#F7F4EB]' : 'text-[#121316]',
      headerBgClass: isNight
        ? 'bg-[#0D1017]/95 border-[#26231D]'
        : 'bg-[#FBF9F5]/95 border-[#E2DDD2]',
      cardClass: isNight
        ? 'bg-[#11151E] border border-[#2C271E] rounded-md'
        : 'bg-[#FFFFFF] border border-[#DFD9CE] rounded-md',
      subPanelClass: isNight
        ? 'bg-[#0B0E14] border border-[#242019] rounded-md'
        : 'bg-[#F9F7F2] border border-[#E5E0D5] rounded-md',
      inputClass: isNight
        ? 'bg-[#090B10] border-[#332D22] text-[#F7F4EB] rounded-md'
        : 'bg-white border-[#D5CFC2] text-[#121316] rounded-md',
      mutedTextClass: isNight ? 'text-[#A39E93]' : 'text-[#635E54]',
      dividerClass: isNight ? 'divide-[#26221B] border-[#26221B]' : 'divide-[#E6E1D6] border-[#E6E1D6]',
      headingFontClass: 'font-serif-display tracking-tight',
      chartGridStroke: isNight ? '#24211B' : '#E6E1D6',
      chartAxisStroke: isNight ? '#A39E93' : '#635E54',
      chartTooltipBg: '#0B0E14',
      modeBadgeLabel: 'Bold Luxurious Rich',
      politeGreetingPrefix: 'Private Wealth Ledger ·',
    };
  }

  // 'futuristic' — Futuristic, Edgy, Abstract
  return {
    isNight,
    accentHex,
    accentSoftBg,
    pageBgClass: isNight ? 'bg-[#060913] text-[#F1F5F9]' : 'bg-[#F1F5F9] text-[#090D16]',
    pageTextClass: isNight ? 'text-[#F1F5F9]' : 'text-[#090D16]',
    headerBgClass: isNight
      ? 'bg-[#090E1C]/95 border-[#1E293B]'
      : 'bg-[#FFFFFF]/95 border-[#CBD5E1]',
    cardClass: isNight
      ? 'bg-[#0B1222] border border-[#1E293B] rounded-none'
      : 'bg-white border border-[#CBD5E1] rounded-none',
    subPanelClass: isNight
      ? 'bg-[#080D1A] border border-[#1E293B] rounded-none'
      : 'bg-[#F8FAFC] border border-[#E2E8F0] rounded-none',
    inputClass: isNight
      ? 'bg-[#060913] border-[#334155] text-[#F1F5F9] rounded-none'
      : 'bg-white border-[#CBD5E1] text-[#090D16] rounded-none',
    mutedTextClass: isNight ? 'text-[#94A3B8]' : 'text-[#475569]',
    dividerClass: isNight ? 'divide-[#1E293B] border-[#1E293B]' : 'divide-[#E2E8F0] border-[#E2E8F0]',
    headingFontClass: 'font-futuristic tracking-tight',
    chartGridStroke: isNight ? '#1E293B' : '#E2E8F0',
    chartAxisStroke: isNight ? '#94A3B8' : '#475569',
    chartTooltipBg: '#060913',
    modeBadgeLabel: 'Futuristic Edgy Abstract',
    politeGreetingPrefix: 'Spatial Finance Telemetry ·',
  };
}
