import React, { useState, useEffect, useCallback, useRef } from 'react';
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

function LoadingScreen(): React.JSX.Element {
  const gradColors = getThemeGradient('light');
  return (
    <LinearGradient
      testID="auth-loading-screen"
      colors={[gradColors[0], gradColors[1], gradColors[2]]}
      style={styles.loadingScreen}
    >
      <StatusBar style="dark" />
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#4F46E5" testID="auth-loading-spinner" />
        <Text style={[styles.loadingText, { color: '#64748B' }]}>
          Chargement de votre session...
        </Text>
      </View>
    </LinearGradient>
  );
}

function MainApp(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

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

  // Hydratation initiale des données (local ou cloud déjà synchronisé par la garde)
  useEffect(() => {
    let active = true;
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
  }, []);

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
            paddingVertical: 32,
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

export default function App(): React.JSX.Element {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isPulling, setIsPulling] = useState(false);
  const pulledFor = useRef<string | null>(null);

  useEffect(() => {
    if (isLocalMode || !user) {
      pulledFor.current = null;
      setIsPulling(false);
      return;
    }
    if (pulledFor.current === user.id) return; // un seul pull par compte
    pulledFor.current = user.id;
    let cancelled = false;
    setIsPulling(true);
    pullFromCloud(user.id).finally(() => {
      if (!cancelled) setIsPulling(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!isLocalMode && (isLoading || isPulling)) return <LoadingScreen />;
  if (!isLocalMode && !isAuthenticated) return <AuthScreen />;
  return <MainApp key={user?.id ?? 'local'} />;
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
