import type { ThemeMode } from '../types/veyl';

/**
 * Structure de tokens conforme à stack-target.md §2
 */
export const gradient = {
  colors: ['#F8FAFC', '#EEF2FF', '#F5F3FF', '#FAF5FF'] as const,
  locations: [0, 0.35, 0.7, 1] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

export interface ThemeColors {
  // Tokens obligatoires stack-target.md §2
  brand: string;
  brandMuted: string;
  primary: string;
  primaryLight: string;
  primarySoft: string;
  primaryBackground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnBrand: string;
  panel: string;
  panelSubtle: string;
  surface: string;
  surfaceActive: string;
  border: string;
  borderStrong: string;
  divider: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  positive: string;
  positiveSoft: string;
  backdrop: string;

  // Extensions Veyl & rétro-compatibilité
  mode: ThemeMode;
  background: string;
  backgroundSecondary: string;
  surfaceElevated: string;
  surfaceTranslucent: string;
  surfaceMuted: string;
  headerBg: string;
  borderSubtle: string;
  textInverse: string;
  primaryHover: string;
  primaryBorder: string;
  accentViolet: string;
  categoryIA: string;
  categoryIASoft: string;
  categoryLux: string;
  categoryLuxSoft: string;
  categoryTech: string;
  categoryTechSoft: string;
  success: string;
  successSoft: string;
  dangerBorder: string;
  cardHeaderBg: string;
  shadowColor: string;
}

export const lightColors: ThemeColors = {
  // Tokens stack-target.md §2
  brand: '#4F46E5',
  brandMuted: '#818CF8',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primarySoft: '#EEF2FF',
  primaryBackground: '#FFFFFF',
  textPrimary: '#171717',
  textSecondary: '#525252',
  textMuted: '#737373',
  textOnBrand: '#FFFFFF',
  panel: 'rgba(255, 255, 255, 0.82)',
  panelSubtle: 'rgba(255, 255, 255, 0.60)',
  surface: '#FFFFFF',
  surfaceActive: '#FFFFFF',
  border: '#E5E5E5',
  borderStrong: '#D4D4D4',
  divider: '#E5E5E5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  positive: '#15803D',
  positiveSoft: '#DCFCE7',
  backdrop: 'rgba(15, 23, 42, 0.5)',

  // Propriétés complémentaires Veyl
  mode: 'light',
  background: '#FFFFFF',
  backgroundSecondary: '#FAFAFA',
  surfaceElevated: '#FFFFFF',
  surfaceTranslucent: 'rgba(255, 255, 255, 0.95)',
  surfaceMuted: '#F5F5F5',
  headerBg: '#FAFAFA',
  borderSubtle: '#F5F5F5',
  textInverse: '#FFFFFF',
  primaryHover: '#4338CA',
  primaryBorder: '#C7D2FE',
  accentViolet: '#7C3AED',
  categoryIA: '#4F46E5',
  categoryIASoft: '#EEF2FF',
  categoryLux: '#2563EB',
  categoryLuxSoft: '#EFF6FF',
  categoryTech: '#16A34A',
  categoryTechSoft: '#F0FDF4',
  success: '#15803D',
  successSoft: '#DCFCE7',
  dangerBorder: '#FECACA',
  cardHeaderBg: '#FAFAFA',
  shadowColor: '#000000',
};

export const darkColors: ThemeColors = {
  // Tokens stack-target.md §2
  brand: '#6366F1',
  brandMuted: '#4F46E5',
  primary: '#6366F1',
  primaryLight: '#1E1B4B',
  primarySoft: 'rgba(99, 102, 241, 0.16)',
  primaryBackground: '#0A0A0A',
  textPrimary: '#FAFAFA',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',
  textOnBrand: '#FFFFFF',
  panel: 'rgba(17, 24, 39, 0.82)',
  panelSubtle: 'rgba(17, 24, 39, 0.60)',
  surface: '#171717',
  surfaceActive: '#0A0A0A',
  border: '#262626',
  borderStrong: '#404040',
  divider: '#262626',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.15)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  positive: '#4ADE80',
  positiveSoft: 'rgba(74, 222, 128, 0.15)',
  backdrop: 'rgba(0, 0, 0, 0.7)',

  // Propriétés complémentaires Veyl
  mode: 'dark',
  background: '#0A0A0A',
  backgroundSecondary: '#171717',
  surfaceElevated: '#171717',
  surfaceTranslucent: 'rgba(23, 23, 23, 0.95)',
  surfaceMuted: '#262626',
  headerBg: '#171717',
  borderSubtle: '#171717',
  textInverse: '#171717',
  primaryHover: '#818CF8',
  primaryBorder: 'rgba(129, 140, 248, 0.35)',
  accentViolet: '#8B5CF6',
  categoryIA: '#818CF8',
  categoryIASoft: 'rgba(129, 140, 248, 0.15)',
  categoryLux: '#60A5FA',
  categoryLuxSoft: 'rgba(96, 165, 250, 0.15)',
  categoryTech: '#4ADE80',
  categoryTechSoft: 'rgba(74, 222, 128, 0.15)',
  success: '#4ADE80',
  successSoft: 'rgba(74, 222, 128, 0.15)',
  dangerBorder: 'rgba(248, 113, 113, 0.35)',
  cardHeaderBg: 'rgba(23, 23, 23, 0.5)',
  shadowColor: '#000000',
};

// Export conforme stack-target.md §2 (colors par défaut)
export const colors = lightColors;

// Rayons conformes stack-target.md §2
export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 9999,
} as const;

// Alias pour rétro-compatibilité
export const radii = radius;

// Espacements conformes stack-target.md §2
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Ombres douces conformes stack-target.md §2 et Tailwind shadow-sm
export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

export function getThemeGradient(mode: ThemeMode): readonly [string, string, string] {
  return mode === 'dark'
    ? (['#090D16', '#0F172A', '#131B2E'] as const)
    : (['#F8FAFC', '#EEF2FF', '#F5F3FF'] as const);
}
