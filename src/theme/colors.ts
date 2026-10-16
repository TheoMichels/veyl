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
  shadowColor: string;
}

export const lightColors: ThemeColors = {
  // Tokens stack-target.md §2
  brand: '#4F46E5',
  brandMuted: '#818CF8',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primarySoft: '#EEF2FF',
  primaryBackground: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textOnBrand: '#FFFFFF',
  panel: 'rgba(255, 255, 255, 0.82)',
  panelSubtle: 'rgba(255, 255, 255, 0.60)',
  surface: 'rgba(255, 255, 255, 0.90)',
  surfaceActive: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  divider: '#E2E8F0',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  positive: '#15803D',
  positiveSoft: '#DCFCE7',
  backdrop: 'rgba(15, 23, 42, 0.5)',

  // Propriétés complémentaires Veyl
  mode: 'light',
  background: '#F8FAFC',
  backgroundSecondary: '#EEF2FF',
  surfaceElevated: '#FFFFFF',
  surfaceTranslucent: 'rgba(255, 255, 255, 0.86)',
  surfaceMuted: '#F1F5F9',
  headerBg: 'rgba(255, 255, 255, 0.92)',
  borderSubtle: '#EEF2F6',
  textInverse: '#FFFFFF',
  primaryHover: '#4338CA',
  primaryBorder: '#C7D2FE',
  accentViolet: '#7C3AED',
  categoryIA: '#4F46E5',
  categoryIASoft: '#EEF2FF',
  categoryLux: '#2563EB',
  categoryLuxSoft: '#EFF6FF',
  categoryTech: '#059669',
  categoryTechSoft: '#ECFDF5',
  success: '#15803D',
  successSoft: '#DCFCE7',
  dangerBorder: '#FECACA',
  shadowColor: '#0F172A',
};

export const darkColors: ThemeColors = {
  // Tokens stack-target.md §2
  brand: '#6366F1',
  brandMuted: '#4F46E5',
  primary: '#6366F1',
  primaryLight: '#1E1B4B',
  primarySoft: 'rgba(99, 102, 241, 0.16)',
  primaryBackground: '#090D16',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textOnBrand: '#FFFFFF',
  panel: 'rgba(17, 24, 39, 0.82)',
  panelSubtle: 'rgba(17, 24, 39, 0.60)',
  surface: 'rgba(17, 24, 39, 0.90)',
  surfaceActive: '#1E293B',
  border: '#1E293B',
  borderStrong: '#334155',
  divider: '#1E293B',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.15)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  positive: '#4ADE80',
  positiveSoft: 'rgba(74, 222, 128, 0.15)',
  backdrop: 'rgba(0, 0, 0, 0.7)',

  // Propriétés complémentaires Veyl
  mode: 'dark',
  background: '#090D16',
  backgroundSecondary: '#111827',
  surfaceElevated: '#1E293B',
  surfaceTranslucent: 'rgba(17, 24, 39, 0.86)',
  surfaceMuted: '#1E293B',
  headerBg: 'rgba(9, 13, 22, 0.92)',
  borderSubtle: '#172033',
  textInverse: '#0F172A',
  primaryHover: '#818CF8',
  primaryBorder: 'rgba(129, 140, 248, 0.35)',
  accentViolet: '#8B5CF6',
  categoryIA: '#818CF8',
  categoryIASoft: 'rgba(129, 140, 248, 0.15)',
  categoryLux: '#60A5FA',
  categoryLuxSoft: 'rgba(96, 165, 250, 0.15)',
  categoryTech: '#34D399',
  categoryTechSoft: 'rgba(52, 211, 153, 0.15)',
  success: '#4ADE80',
  successSoft: 'rgba(74, 222, 128, 0.15)',
  dangerBorder: 'rgba(248, 113, 113, 0.35)',
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

// Ombres douces teintées conformes stack-target.md §2
export const shadows = {
  sm: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
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
