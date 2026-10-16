import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Svg, { Path, Rect } from 'react-native-svg';
import ExpandableNewsSection from './ExpandableNewsSection';
import { radii, spacing, shadows, type ThemeColors } from '../theme/colors';
import type { DayGroup, Digest, TabId } from '../types/veyl';

interface DigestDashboardProps {
  groupedDigests: DayGroup[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => Promise<void>;
  onRetry: () => Promise<void>;
  colors: ThemeColors;
}

export default function DigestDashboard({
  groupedDigests,
  isLoading,
  isGenerating,
  error,
  onGenerate,
  onRetry,
  colors,
}: DigestDashboardProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [activeTab, setActiveTab] = useState<TabId>('ia');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);

  const filteredDigests = useMemo(() => {
    return groupedDigests.filter((group) => {
      if (activeTab === 'ia') return group.iaDigest !== null;
      if (activeTab === 'lux') return group.luxDigest !== null;
      if (activeTab === 'tech') return group.techDigest !== null;
      return false;
    });
  }, [groupedDigests, activeTab]);

  const effectiveSelectedDate = useMemo(() => {
    if (filteredDigests.length === 0) return null;
    if (selectedDate && filteredDigests.some((g) => g.dateStr === selectedDate)) {
      return selectedDate;
    }
    return filteredDigests[0].dateStr;
  }, [filteredDigests, selectedDate]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const nextFiltered = groupedDigests.filter((group) => {
      if (tab === 'ia') return group.iaDigest !== null;
      if (tab === 'lux') return group.luxDigest !== null;
      if (tab === 'tech') return group.techDigest !== null;
      return false;
    });
    setSelectedDate(nextFiltered.length > 0 ? nextFiltered[0].dateStr : null);
  };

  const activeGroup = useMemo(
    () => groupedDigests.find((g) => g.dateStr === effectiveSelectedDate) || null,
    [groupedDigests, effectiveSelectedDate]
  );

  const currentDigest: Digest | null = useMemo(() => {
    if (!activeGroup) return null;
    if (activeTab === 'ia') return activeGroup.iaDigest;
    if (activeTab === 'lux') return activeGroup.luxDigest;
    return activeGroup.techDigest;
  }, [activeGroup, activeTab]);

  const categoryMeta = useMemo(() => {
    if (activeTab === 'ia') {
      return {
        label: 'Intelligence Artificielle',
        shortLabel: 'IA',
        accent: colors.categoryIA,
        softBg: colors.categoryIASoft,
      };
    }
    if (activeTab === 'lux') {
      return {
        label: 'Marché IT Luxembourg',
        shortLabel: 'Luxembourg',
        accent: colors.categoryLux,
        softBg: colors.categoryLuxSoft,
      };
    }
    return {
      label: 'Tech & Hardware',
      shortLabel: 'Tech',
      accent: colors.categoryTech,
      softBg: colors.categoryTechSoft,
    };
  }, [activeTab, colors]);

  return (
    <View
      style={[
        styles.root,
        isMobile ? styles.rootMobile : styles.rootDesktop,
      ]}
    >
      {/* Panneau latéral (Desktop) ou En-tête d'historique (Mobile) */}
      {(isMobile || isSidebarOpen) && (
        <View
          style={[
            styles.sidebar,
            isMobile ? styles.sidebarMobile : styles.sidebarDesktop,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            shadows.card,
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Text style={[styles.sidebarTitle, { color: colors.textPrimary }]}>
              Votre veille
            </Text>
            <Text style={[styles.sidebarSubtitle, { color: colors.textMuted }]}>
              Les synthèses quotidiennes par catégorie.
            </Text>
          </View>

          <Pressable
            testID="generate-digest-btn"
            onPress={() => {
              onGenerate().catch(() => {});
            }}
            disabled={isGenerating}
            style={[
              styles.generateBtn,
              {
                backgroundColor: isGenerating ? colors.primaryHover : colors.primary,
                opacity: isGenerating ? 0.75 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Générer la veille du jour"
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
            <Text style={styles.generateBtnText}>
              {isGenerating ? 'Génération...' : 'Générer la veille du jour'}
            </Text>
          </Pressable>

          {isMobile ? (
            <View style={styles.mobileHistorySection}>
              <Pressable
                testID="mobile-history-trigger"
                onPress={() => setIsMobileHistoryOpen((prev) => !prev)}
                style={[
                  styles.mobileAccordionBtn,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Afficher l'historique par date"
              >
                <Text style={[styles.mobileAccordionLabel, { color: colors.textPrimary }]}>
                  📅 {activeGroup ? activeGroup.displayDate : 'Sélectionner une date'}
                </Text>
                <Text style={[styles.mobileAccordionChevron, { color: colors.textMuted }]}>
                  {isMobileHistoryOpen ? '▲' : '▼'}
                </Text>
              </Pressable>

              {isMobileHistoryOpen && (
                <View style={styles.historyList}>
                  {filteredDigests.length === 0 ? (
                    <Text style={[styles.noHistoryText, { color: colors.textMuted }]}>
                      Aucune veille disponible.
                    </Text>
                  ) : (
                    filteredDigests.map((group) => {
                      const active = effectiveSelectedDate === group.dateStr;
                      return (
                        <Pressable
                          key={group.dateStr}
                          testID={`history-date-${group.dateStr}`}
                          onPress={() => {
                            setSelectedDate(group.dateStr);
                            setIsMobileHistoryOpen(false);
                          }}
                          style={[
                            styles.historyItem,
                            {
                              backgroundColor: active ? colors.primarySoft : 'transparent',
                              borderColor: active ? colors.primaryBorder : 'transparent',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.historyItemText,
                              {
                                color: active ? colors.primary : colors.textSecondary,
                                fontWeight: active ? '700' : '500',
                              },
                            ]}
                          >
                            {group.displayDate}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.desktopHistorySection}>
              <Text style={[styles.historyHeading, { color: colors.textMuted }]}>
                HISTORIQUE
              </Text>
              <ScrollView style={styles.historyScroll}>
                {filteredDigests.length === 0 ? (
                  <Text style={[styles.noHistoryText, { color: colors.textMuted }]}>
                    Aucune veille disponible.
                  </Text>
                ) : (
                  filteredDigests.map((group) => {
                    const active = effectiveSelectedDate === group.dateStr;
                    return (
                      <Pressable
                        key={group.dateStr}
                        testID={`history-date-${group.dateStr}`}
                        onPress={() => setSelectedDate(group.dateStr)}
                        style={[
                          styles.historyItem,
                          {
                            backgroundColor: active ? colors.primarySoft : 'transparent',
                            borderColor: active ? colors.primaryBorder : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyItemText,
                            {
                              color: active ? colors.primary : colors.textSecondary,
                              fontWeight: active ? '700' : '500',
                            },
                          ]}
                        >
                          {group.displayDate}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Zone principale */}
      <View style={styles.mainArea}>
        {/* Barre d'outils et onglets */}
        <View style={styles.topControlsRow}>
          {!isMobile && (
            <Pressable
              testID="sidebar-toggle-btn"
              onPress={() => setIsSidebarOpen((prev) => !prev)}
              style={[
                styles.sidebarToggleBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isSidebarOpen ? 'Masquer le panneau latéral' : 'Afficher le panneau latéral'
              }
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  stroke={colors.textSecondary}
                  strokeWidth="2"
                />
                <Path d="M9 3v18" stroke={colors.textSecondary} strokeWidth="2" />
              </Svg>
            </Pressable>
          )}

          <View
            style={[
              styles.tabsContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              testID="tab-ia"
              onPress={() => handleTabChange('ia')}
              style={[
                styles.tabButton,
                activeTab === 'ia' && {
                  backgroundColor: colors.categoryIASoft,
                  borderColor: colors.primaryBorder,
                },
              ]}
              accessibilityRole="tab"
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === 'ia' ? colors.categoryIA : colors.textSecondary,
                    fontWeight: activeTab === 'ia' ? '700' : '500',
                  },
                ]}
              >
                ✨ Intelligence Artificielle
              </Text>
            </Pressable>

            <Pressable
              testID="tab-lux"
              onPress={() => handleTabChange('lux')}
              style={[
                styles.tabButton,
                activeTab === 'lux' && {
                  backgroundColor: colors.categoryLuxSoft,
                  borderColor: colors.categoryLux,
                },
              ]}
              accessibilityRole="tab"
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === 'lux' ? colors.categoryLux : colors.textSecondary,
                    fontWeight: activeTab === 'lux' ? '700' : '500',
                  },
                ]}
              >
                🇱🇺 Marché IT Luxembourg
              </Text>
            </Pressable>

            <Pressable
              testID="tab-tech"
              onPress={() => handleTabChange('tech')}
              style={[
                styles.tabButton,
                activeTab === 'tech' && {
                  backgroundColor: colors.categoryTechSoft,
                  borderColor: colors.categoryTech,
                },
              ]}
              accessibilityRole="tab"
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === 'tech' ? colors.categoryTech : colors.textSecondary,
                    fontWeight: activeTab === 'tech' ? '700' : '500',
                  },
                ]}
              >
                ⚙️ Tech & Hardware
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bannière d'erreur éventuelle */}
        {error ? (
          <View
            testID="error-banner"
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.dangerSoft,
                borderColor: colors.dangerBorder,
              },
            ]}
          >
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>
              {error}
            </Text>
            <Pressable
              onPress={() => {
                onRetry().catch(() => {});
              }}
              style={[styles.retryBtn, { borderColor: colors.danger }]}
            >
              <Text style={[styles.retryBtnText, { color: colors.danger }]}>Réessayer</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Carte principale de lecture */}
        <View
          style={[
            styles.digestCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            shadows.card,
          ]}
        >
          <View
            style={[
              styles.digestCardHeader,
              {
                backgroundColor: categoryMeta.softBg,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.categoryBadgeRow}>
              <View
                style={[styles.categoryDot, { backgroundColor: categoryMeta.accent }]}
              />
              <Text style={[styles.categoryHeaderTitle, { color: colors.textPrimary }]}>
                {categoryMeta.label}
                {activeGroup ? ` — ${activeGroup.displayDate}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.digestCardBody}>
            {isLoading ? (
              <View style={styles.skeletonContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.skeletonText, { color: colors.textMuted }]}>
                  Chargement des synthèses de veille...
                </Text>
              </View>
            ) : !currentDigest ? (
              <View testID="empty-state" style={styles.emptyState}>
                <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                  Aucune synthèse {categoryMeta.shortLabel} générée pour cette date.
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: colors.textMuted }]}>
                  Lancez une génération quotidienne pour agréger les flux RSS actifs avec Gemini.
                </Text>
              </View>
            ) : (
              <View style={styles.digestContentWrapper}>
                <Text style={[styles.digestTitle, { color: colors.textPrimary }]}>
                  {currentDigest.title}
                </Text>
                <Text style={[styles.digestTimestamp, { color: colors.textMuted }]}>
                  Généré{' '}
                  {formatDistanceToNow(new Date(currentDigest.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </Text>

                <ExpandableNewsSection
                  content={currentDigest.content}
                  colors={colors}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    maxWidth: 1360,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  rootDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rootMobile: {
    flexDirection: 'column',
  },
  sidebar: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sidebarDesktop: {
    width: 272,
  },
  sidebarMobile: {
    width: '100%',
  },
  sidebarHeader: {
    gap: 4,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sidebarSubtitle: {
    fontSize: 12,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mobileHistorySection: {
    gap: spacing.sm,
  },
  mobileAccordionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  mobileAccordionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  mobileAccordionChevron: {
    fontSize: 12,
  },
  desktopHistorySection: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  historyHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  historyScroll: {
    maxHeight: 420,
  },
  historyList: {
    gap: 4,
  },
  noHistoryText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  historyItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: 4,
  },
  historyItemText: {
    fontSize: 13,
  },
  mainArea: {
    flex: 1,
    width: '100%',
    gap: spacing.md,
  },
  topControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sidebarToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 5,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  tabButton: {
    flexGrow: 1,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  digestCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  digestCardHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
  },
  categoryHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  digestCardBody: {
    padding: spacing.lg,
  },
  skeletonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  skeletonText: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 420,
  },
  digestContentWrapper: {
    gap: spacing.md,
  },
  digestTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  digestTimestamp: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
});
