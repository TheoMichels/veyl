import type { ThemeMode } from '../types/veyl';

export interface ThemeColors {
  mode: ThemeMode;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceTranslucent: string;
  surfaceMuted: string;
  headerBg: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
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
  danger: string;
  dangerSoft: string;
  dangerBorder: string;
  warning: string;
  warningSoft: string;
  shadowColor: string;
}

export const lightColors: ThemeColors = {
  mode: 'light',
  background: '#F8FAFC',
  backgroundSecondary: '#EEF2FF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceTranslucent: 'rgba(255, 255, 255, 0.86)',
  surfaceMuted: '#F1F5F9',
  headerBg: 'rgba(255, 255, 255, 0.92)',
  border: '#E2E8F0',
  borderSubtle: '#EEF2F6',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primarySoft: '#EEF2FF',
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
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  shadowColor: '#0F172A',
};

export const darkColors: ThemeColors = {
  mode: 'dark',
  background: '#090D16',
  backgroundSecondary: '#111827',
  surface: '#111827',
  surfaceElevated: '#1E293B',
  surfaceTranslucent: 'rgba(17, 24, 39, 0.86)',
  surfaceMuted: '#1E293B',
  headerBg: 'rgba(9, 13, 22, 0.92)',
  border: '#1E293B',
  borderSubtle: '#172033',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textInverse: '#0F172A',
  primary: '#6366F1',
  primaryHover: '#818CF8',
  primarySoft: 'rgba(99, 102, 241, 0.16)',
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
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  dangerBorder: 'rgba(248, 113, 113, 0.35)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.15)',
  shadowColor: '#000000',
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const shadows = {
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  elevated: {
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
