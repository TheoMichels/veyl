import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, useWindowDimensions, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Header from './src/components/Header';
import DigestDashboard from './src/components/DigestDashboard';
import SettingsView from './src/components/SettingsView';
import { AuthScreen } from './src/components/AuthScreen';
import {
  getGroupedDigests,
  triggerDailyDigestsGeneration,
} from './src/storage/digestRepository';
import { pullFromCloud } from './src/services/syncService';
import { useAuth } from './src/hooks/useAuth';
import { isLocalMode } from './src/config/storageMode';
import { getThemeColors, getThemeGradient } from './src/theme/colors';
import type { DayGroup, ThemeMode, ViewMode } from './src/types/veyl';

export default function App() {
  const { width } = useWindowDimensions();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [groupedDigests, setGroupedDigests] = useState<DayGroup[]>([]);
  const [isLoadingDigests, setIsLoadingDigests] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const colors = getThemeColors(themeMode);
  const horizontalPadding = width < 640 ? 16 : width < 1024 ? 24 : 32;

  const loadDigests = useCallback(async () => {
    setIsLoadingDigests(true);
    setDashboardError(null);
    try {
      const groups = await getGroupedDigests();
      setGroupedDigests(groups);
    } catch (err: unknown) {
      setDashboardError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les synthèses de veille.'
      );
    } finally {
      setIsLoadingDigests(false);
    }
  }, []);

  // Hydratation & synchronisation selon le mode
  useEffect(() => {
    let active = true;

    if (isLocalMode) {
      (async () => {
        try {
          const groups = await getGroupedDigests();
          if (!active) return;
          setGroupedDigests(groups);
          setDashboardError(null);
        } catch (err: unknown) {
          if (!active) return;
          setDashboardError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger les synthèses de veille.'
          );
        } finally {
          if (active) {
            setIsLoadingDigests(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }

    // Mode cloud / production
    if (isAuthenticated && user?.id) {
      setIsLoadingDigests(true);
      (async () => {
        try {
          await pullFromCloud(user.id);
          if (!active) return;
          const groups = await getGroupedDigests();
          if (!active) return;
          setGroupedDigests(groups);
          setDashboardError(null);
        } catch (err: unknown) {
          if (!active) return;
          setDashboardError(
            err instanceof Error
              ? err.message
              : 'Impossible de synchroniser vos synthèses cloud.'
          );
        } finally {
          if (active) {
            setIsLoadingDigests(false);
          }
        }
      })();
    } else {
      // Non connecté en production
      setGroupedDigests([]);
      setIsLoadingDigests(false);
    }

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);

  const handleGenerateDigests = async () => {
    setIsGenerating(true);
    setDashboardError(null);
    try {
      await triggerDailyDigestsGeneration();
      const updatedGroups = await getGroupedDigests();
      setGroupedDigests(updatedGroups);
    } catch (err: unknown) {
      setDashboardError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la génération de la veille.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Garde d'authentification en mode production (AC-02, AC-03)
  if (!isLocalMode) {
    if (isAuthLoading) {
      const gradColors = getThemeGradient(themeMode);
      return (
        <LinearGradient
          testID="auth-loading-screen"
          colors={[gradColors[0], gradColors[1], gradColors[2]]}
          style={styles.loadingScreen}
        >
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#4F46E5" testID="auth-loading-spinner" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Chargement de votre session...
            </Text>
          </View>
        </LinearGradient>
      );
    }

    if (!isAuthenticated) {
      return (
        <>
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
          <AuthScreen />
        </>
      );
    }
  }

  // Dashboard principal (mode local ou production connecté)
  return (
    <View style={[styles.appShell, { backgroundColor: colors.background }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Header
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        viewMode={viewMode}
        onNavigate={setViewMode}
        colors={colors}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingVertical: 32, // py-8
          },
        ]}
      >
        {viewMode === 'dashboard' ? (
          <DigestDashboard
            groupedDigests={groupedDigests}
            isLoading={isLoadingDigests}
            isGenerating={isGenerating}
            error={dashboardError}
            onGenerate={handleGenerateDigests}
            onRetry={loadDigests}
            colors={colors}
          />
        ) : (
          <SettingsView colors={colors} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
