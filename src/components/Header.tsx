import React from 'react';
import { View, Text, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { isLocalMode } from '../config/storageMode';
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
        {
          backgroundColor: colors.headerBg,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={[styles.inner, isMobile ? styles.innerMobile : styles.innerDesktop]}>
        <Pressable
          testID="nav-home-btn"
          onPress={() => onNavigate('dashboard')}
          style={styles.brandButton}
          accessibilityRole="button"
          accessibilityLabel="Veyl - Accueil"
        >
          <LinearGradient
            colors={['#6366F1', '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.45" />
              <Circle cx="12" cy="12" r="5" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.75" />
              <Circle cx="12" cy="12" r="2" fill="#FFFFFF" />
              <Path d="M12 12L18.5 5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            </Svg>
          </LinearGradient>
          <Text
            style={[
              styles.brandTitle,
              { color: themeMode === 'dark' ? '#818CF8' : '#4F46E5' },
            ]}
          >
            Veyl
          </Text>
        </Pressable>

        <View style={styles.actions}>
          {isLocalMode && (
            <View
              style={[
                styles.localBadge,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                testID="storage-mode-badge"
                style={[styles.localBadgeText, { color: colors.textSecondary }]}
              >
                Stockage local
              </Text>
            </View>
          )}

          <Pressable
            testID="theme-toggle-btn"
            onPress={onToggleTheme}
            style={[
              styles.iconButton,
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
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="4" stroke={colors.warning} strokeWidth="2" />
                <Path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                  stroke={colors.warning}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            ) : (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  stroke={colors.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
          </Pressable>

          <Pressable
            testID="nav-settings-btn"
            onPress={() => onNavigate(viewMode === 'settings' ? 'dashboard' : 'settings')}
            style={[
              styles.iconButton,
              {
                backgroundColor:
                  viewMode === 'settings' ? colors.primarySoft : colors.surfaceMuted,
                borderColor:
                  viewMode === 'settings' ? colors.primaryBorder : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Paramètres"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    width: '100%',
    zIndex: 10,
  },
  inner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  },
  innerDesktop: {
    paddingHorizontal: spacing.xl,
  },
  innerMobile: {
    paddingHorizontal: spacing.lg,
  },
  brandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm, // 12
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
