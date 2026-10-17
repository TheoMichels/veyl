import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Header from './src/components/Header';
import DigestDashboard from './src/components/DigestDashboard';
import SettingsView from './src/components/SettingsView';
import {
  getGroupedDigests,
  triggerDailyDigestsGeneration,
} from './src/storage/digestRepository';
import { getThemeColors } from './src/theme/colors';
import type { DayGroup, ThemeMode, ViewMode } from './src/types/veyl';

export default function App() {
  const { width } = useWindowDimensions();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  const [groupedDigests, setGroupedDigests] = useState<DayGroup[]>([]);
  const [isLoadingDigests, setIsLoadingDigests] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const colors = getThemeColors(themeMode);
  const horizontalPadding = width < 640 ? 16 : width < 1024 ? 24 : 32;

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
});
