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
import { radius, spacing, shadows, type ThemeColors } from '../theme/colors';
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

  return (
    <View style={[styles.root, isMobile ? styles.rootMobile : styles.rootDesktop]}>
      {/* Sidebar for dates */}
      {(isMobile || isSidebarOpen) && (
        <View
          style={[
            styles.sidebar,
            isMobile ? styles.sidebarMobile : styles.sidebarDesktop,
            {
              borderRightColor: colors.border,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Text style={[styles.sidebarTitle, { color: colors.textPrimary }]}>
              Votre veille
            </Text>
            <Text style={[styles.sidebarSubtitle, { color: colors.textMuted }]}>
              Les synthèses par jour.
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
                backgroundColor: colors.brand,
                opacity: isGenerating ? 0.6 : 1,
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
                  d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M3 3v5h5"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M16 21h5v-5"
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

          {/* Accordéon Mobile */}
          {isMobile ? (
            <View style={styles.mobileHistoryBlock}>
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
              >
                <View style={styles.mobileAccordionLeft}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={colors.textMuted} strokeWidth="2" />
                    <Path d="M16 2v4M8 2v4M3 10h18" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                  <Text style={[styles.mobileAccordionText, { color: colors.textPrimary }]}>
                    {activeGroup ? activeGroup.displayDate : 'Sélectionner une date'}
                  </Text>
                </View>
                <Text style={[styles.mobileAccordionChevron, { color: colors.textMuted }]}>
                  {isMobileHistoryOpen ? '▲' : '▼'}
                </Text>
              </Pressable>

              {isMobileHistoryOpen && (
                <View style={styles.historyListMobile}>
                  {filteredDigests.length === 0 ? (
                    <Text style={[styles.noDigestsText, { color: colors.textMuted }]}>
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
                            styles.historyItemBtn,
                            {
                              backgroundColor: active ? colors.surfaceMuted : 'transparent',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.historyItemText,
                              {
                                color: active ? colors.textPrimary : colors.textSecondary,
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
            /* Historique Desktop */
            <View style={styles.desktopHistoryBlock}>
              <View style={styles.historyHeaderRow}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="4" width="18" height="18" rx="2" stroke={colors.textPrimary} strokeWidth="2" />
                  <Path d="M16 2v4M8 2v4M3 10h18" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" />
                </Svg>
                <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
                  Historique
                </Text>
              </View>

              <ScrollView style={styles.historyScroll}>
                {filteredDigests.length === 0 ? (
                  <Text style={[styles.noDigestsText, { color: colors.textMuted }]}>
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
                          styles.historyItemBtn,
                          {
                            backgroundColor: active ? colors.surfaceMuted : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyItemText,
                            {
                              color: active ? colors.textPrimary : colors.textSecondary,
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

      {/* Main Content Area */}
      <View style={styles.mainArea}>
        {/* Top Controls Row */}
        <View style={styles.topControlsRow}>
          {!isMobile && (
            <Pressable
              testID="sidebar-toggle-btn"
              onPress={() => setIsSidebarOpen(!isSidebarOpen)}
              style={[
                styles.sidebarToggleBtn,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isSidebarOpen ? 'Masquer le panneau latéral' : 'Afficher le panneau latéral'
              }
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect x="3" y="3" width="18" height="18" rx="2" stroke={colors.textSecondary} strokeWidth="2" />
                <Path d="M9 3v18" stroke={colors.textSecondary} strokeWidth="2" />
              </Svg>
            </Pressable>
          )}

          {/* Onglets IA / Lux / Tech */}
          <View
            style={[
              styles.tabsContainer,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              testID="tab-ia"
              onPress={() => handleTabChange('ia')}
              style={[
                styles.tabBtn,
                activeTab === 'ia' && [
                  styles.tabBtnActive,
                  { backgroundColor: colors.surfaceActive },
                  shadows.sm,
                ],
              ]}
              accessibilityRole="tab"
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                  stroke={activeTab === 'ia' ? colors.brand : colors.textMuted}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: activeTab === 'ia' ? colors.brand : colors.textSecondary,
                    fontWeight: activeTab === 'ia' ? '600' : '500',
                  },
                ]}
              >
                Intelligence Artificielle
              </Text>
            </Pressable>

            <Pressable
              testID="tab-lux"
              onPress={() => handleTabChange('lux')}
              style={[
                styles.tabBtn,
                activeTab === 'lux' && [
                  styles.tabBtnActive,
                  { backgroundColor: colors.surfaceActive },
                  shadows.sm,
                ],
              ]}
              accessibilityRole="tab"
            >
              <Text style={styles.flagIcon}>🇱🇺</Text>
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: activeTab === 'lux' ? '#2563EB' : colors.textSecondary,
                    fontWeight: activeTab === 'lux' ? '600' : '500',
                  },
                ]}
              >
                Marché IT Luxembourg
              </Text>
            </Pressable>

            <Pressable
              testID="tab-tech"
              onPress={() => handleTabChange('tech')}
              style={[
                styles.tabBtn,
                activeTab === 'tech' && [
                  styles.tabBtnActive,
                  { backgroundColor: colors.surfaceActive },
                  shadows.sm,
                ],
              ]}
              accessibilityRole="tab"
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Rect x="4" y="4" width="16" height="16" rx="2" stroke={activeTab === 'tech' ? '#059669' : colors.textMuted} strokeWidth="2" />
                <Rect x="9" y="9" width="6" height="6" stroke={activeTab === 'tech' ? '#059669' : colors.textMuted} strokeWidth="2" />
                <Path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" stroke={activeTab === 'tech' ? '#059669' : colors.textMuted} strokeWidth="2" strokeLinecap="round" />
              </Svg>
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: activeTab === 'tech' ? '#059669' : colors.textSecondary,
                    fontWeight: activeTab === 'tech' ? '600' : '500',
                  },
                ]}
              >
                Tech & Hardware
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bannière d'erreur */}
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

        {/* Card de lecture principale */}
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
          {/* Header coloré selon catégorie */}
          <View
            style={[
              styles.digestCardHeader,
              {
                backgroundColor:
                  activeTab === 'ia'
                    ? colors.categoryIASoft
                    : activeTab === 'lux'
                    ? colors.categoryLuxSoft
                    : colors.categoryTechSoft,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardHeaderTitleRow}>
              {activeTab === 'ia' ? (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                    stroke={colors.brand}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : activeTab === 'lux' ? (
                <Text style={styles.cardHeaderFlag}>🇱🇺</Text>
              ) : (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Rect x="4" y="4" width="16" height="16" rx="2" stroke="#059669" strokeWidth="2" />
                  <Rect x="9" y="9" width="6" height="6" stroke="#059669" strokeWidth="2" />
                  <Path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              )}

              <Text style={[styles.cardHeaderHeading, { color: colors.textPrimary }]}>
                {activeTab === 'ia'
                  ? 'Actualité IA'
                  : activeTab === 'lux'
                  ? 'Marché IT Luxembourg'
                  : 'Actualité Tech'}
                {activeGroup ? ` - ${activeGroup.displayDate}` : ''}
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.digestCardBody}>
            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  Chargement des synthèses de veille...
                </Text>
              </View>
            ) : !currentDigest ? (
              <View testID="empty-state" style={styles.emptyStateBox}>
                <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                  {activeTab === 'ia'
                    ? 'Aucune synthèse IA générée pour cette date.'
                    : activeTab === 'lux'
                    ? 'Aucune synthèse Luxembourg générée pour cette date.'
                    : 'Aucune synthèse Tech générée pour cette date.'}
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
    gap: spacing.xl,
  },
  rootDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rootMobile: {
    flexDirection: 'column',
  },
  sidebar: {
    paddingBottom: spacing.lg,
  },
  sidebarDesktop: {
    width: 256,
    flexShrink: 0,
    borderRightWidth: 1,
    paddingRight: spacing.xl,
  },
  sidebarMobile: {
    width: '100%',
    borderBottomWidth: 1,
  },
  sidebarHeader: {
    marginBottom: spacing.lg,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sidebarSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm, // 12
    marginBottom: spacing.xl,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mobileHistoryBlock: {
    gap: spacing.sm,
  },
  mobileAccordionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  mobileAccordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mobileAccordionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mobileAccordionChevron: {
    fontSize: 12,
  },
  historyListMobile: {
    gap: 4,
    marginTop: spacing.xs,
  },
  desktopHistoryBlock: {
    gap: spacing.sm,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyScroll: {
    maxHeight: 480,
  },
  historyItemBtn: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  historyItemText: {
    fontSize: 14,
  },
  noDigestsText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
    gap: spacing.lg,
  },
  topControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  sidebarToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    padding: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    borderRadius: 8,
  },
  tabBtnText: {
    fontSize: 14,
  },
  flagIcon: {
    fontSize: 16,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  digestCard: {
    borderRadius: radius.md, // 16
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
    minHeight: 400,
  },
  digestCardHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderFlag: {
    fontSize: 20,
    lineHeight: 20,
  },
  cardHeaderHeading: {
    fontSize: 18,
    fontWeight: '700',
  },
  digestCardBody: {
    padding: spacing.xl,
    flex: 1,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyStateBox: {
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  digestContentWrapper: {
    gap: spacing.md,
  },
  digestTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  digestTimestamp: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
});
