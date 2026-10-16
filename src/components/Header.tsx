import React from 'react';
import { View, Text, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { radii, spacing, type ThemeColors } from '../theme/colors';
import type { ThemeMode, ViewMode } from '../types/veyl';

interface HeaderProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  viewMode: ViewMode;
  onNavigate: (view: ViewMode) => void;
  colors: ThemeColors;
}

export default function Header({
  themeMode,
  onToggleTheme,
  viewMode,
  onNavigate,
  colors,
}: HeaderProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View
      style={[
        styles.header,
        isMobile && styles.headerMobile,
        {
          backgroundColor: colors.headerBg,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.inner}>
        <Pressable
          testID="nav-home-btn"
          onPress={() => onNavigate('dashboard')}
          style={styles.brandButton}
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil Veyl"
        >
          <LinearGradient
            colors={[colors.primary, colors.accentViolet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.logoBadge, isMobile && styles.logoBadgeMobile]}
          >
            <Svg width={isMobile ? 18 : 20} height={isMobile ? 18 : 20} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.45" />
              <Circle cx="12" cy="12" r="5" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.75" />
              <Circle cx="12" cy="12" r="2" fill="#FFFFFF" />
              <Path d="M12 12L18.5 5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            </Svg>
          </LinearGradient>
          <View style={styles.brandTextBlock}>
            <Text style={[styles.brandTitle, { color: colors.primary }]}>Veyl</Text>
            {!isMobile && (
              <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
                Veille Stratégique & IA
              </Text>
            )}
          </View>
        </Pressable>

        <View style={[styles.actions, isMobile && styles.actionsMobile]}>
          <Pressable
            testID="theme-toggle-btn"
            onPress={onToggleTheme}
            style={[
              styles.iconButton,
              isMobile && styles.iconButtonMobile,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              themeMode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
            }
          >
            {themeMode === 'dark' ? (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="4" stroke={colors.warning} strokeWidth="2" />
                <Path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                  stroke={colors.warning}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            ) : (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
            <Text
              style={[
                styles.buttonLabel,
                isMobile && styles.buttonLabelMobile,
                { color: colors.textSecondary },
              ]}
            >
              {themeMode === 'dark' ? 'Clair' : 'Sombre'}
            </Text>
          </Pressable>

          <Pressable
            testID="nav-settings-btn"
            onPress={() => onNavigate(viewMode === 'settings' ? 'dashboard' : 'settings')}
            style={[
              styles.iconButton,
              isMobile && styles.iconButtonMobile,
              {
                backgroundColor:
                  viewMode === 'settings' ? colors.primarySoft : colors.surfaceMuted,
                borderColor: viewMode === 'settings' ? colors.primaryBorder : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Paramètres de veille"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Circle
                cx="12"
                cy="12"
                r="3"
                stroke={viewMode === 'settings' ? colors.primary : colors.textSecondary}
                strokeWidth="2"
              />
              <Path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke={viewMode === 'settings' ? colors.primary : colors.textSecondary}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text
              style={[
                styles.buttonLabel,
                isMobile && styles.buttonLabelMobile,
                {
                  color: viewMode === 'settings' ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              Paramètres
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  headerMobile: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  inner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  brandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  brandTextBlock: {
    flexShrink: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeMobile: {
    width: 32,
    height: 32,
  },
  brandTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  actionsMobile: {
    gap: 6,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  iconButtonMobile: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonLabelMobile: {
    fontSize: 12,
  },
});
