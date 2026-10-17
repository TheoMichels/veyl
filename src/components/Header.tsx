import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { isLocalMode } from '../config/storageMode';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';
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
  const horizontalPadding = width < 640 ? 16 : width < 1024 ? 24 : 32;
  const { user, isAuthenticated, signOut } = useAuth();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  const brandGradientStyle =
    Platform.OS === 'web'
      ? ({
          backgroundImage:
            themeMode === 'dark'
              ? 'linear-gradient(to right, #818CF8, #C084FC)'
              : 'linear-gradient(to right, #4F46E5, #9333EA)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        } as any)
      : { color: themeMode === 'dark' ? '#818CF8' : '#4F46E5' };

  return (
    <>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.inner, { paddingHorizontal: horizontalPadding }]}>
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
              {/* Lucide Radar */}
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19.07 4.93A10 10 0 0 0 6.99 3.34"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M4 6h.01"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M2.29 9.62A10 10 0 1 0 21.31 8.35"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M16.24 7.76A6 6 0 1 0 8.23 16.64"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M12 12l4.5-4.5"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            </LinearGradient>
            <Text style={[styles.brandTitle, brandGradientStyle]}>
              Veyl
            </Text>
          </Pressable>

          <View style={styles.actions}>
            {isLocalMode ? (
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
            ) : (
              <View style={styles.cloudActionsRow}>
                <Pressable
                  testID="auth-open-btn"
                  onPress={() => setIsAuthModalVisible(true)}
                  style={[
                    styles.cloudBadge,
                    {
                      backgroundColor: isAuthenticated ? colors.positiveSoft : colors.surfaceMuted,
                      borderColor: isAuthenticated ? 'rgba(21, 128, 61, 0.35)' : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isAuthenticated ? 'Compte connecté' : 'Se connecter'}
                >
                  <Text
                    testID="cloud-user-badge"
                    style={[
                      styles.cloudBadgeText,
                      { color: isAuthenticated ? colors.positive : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {isAuthenticated && user?.email
                      ? `🟢 ${user.email.split('@')[0]}`
                      : '☁️ Connexion'}
                  </Text>
                </Pressable>

                {isAuthenticated && (
                  <Pressable
                    testID="header-signout-btn"
                    onPress={async () => {
                      await signOut();
                    }}
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: colors.dangerSoft,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Déconnexion"
                  >
                    <Text style={{ fontSize: 13 }}>🚪</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Lucide Sun / Moon Toggle */}
            <Pressable
              testID="theme-toggle-btn"
              onPress={onToggleTheme}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={
                themeMode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
              }
            >
              {themeMode === 'dark' ? (
                /* Lucide Sun */
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="4" stroke={colors.textSecondary} strokeWidth="2" />
                  <Path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                    stroke={colors.textSecondary}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </Svg>
              ) : (
                /* Lucide Moon */
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
                    stroke={colors.textSecondary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </Pressable>

            {/* Lucide Settings Button */}
            <Pressable
              testID="nav-settings-btn"
              onPress={() => onNavigate(viewMode === 'settings' ? 'dashboard' : 'settings')}
              style={[
                styles.iconButton,
                viewMode === 'settings' && { backgroundColor: colors.surfaceMuted },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Paramètres"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                  stroke={viewMode === 'settings' ? colors.brand : colors.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke={viewMode === 'settings' ? colors.brand : colors.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>
        </View>
      </View>

      {!isLocalMode && (
        <AuthModal
          visible={isAuthModalVisible}
          onClose={() => setIsAuthModalVisible(false)}
        />
      )}
    </>
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
  cloudActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cloudBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
