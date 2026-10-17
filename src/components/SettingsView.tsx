import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  getSettings,
  saveSettings as saveSettingsRepo,
} from '../storage/settingsRepository';
import {
  getSources,
  createSource,
  toggleSourceStatus,
  removeSource,
} from '../storage/sourceRepository';
import { radius, spacing, shadows, type ThemeColors } from '../theme/colors';
import type { DigestCategory, Source } from '../types/veyl';

interface SettingsViewProps {
  colors: ThemeColors;
}

const CATEGORIES: DigestCategory[] = ['IA', 'Luxembourg', 'Tech'];

export default function SettingsView({ colors }: SettingsViewProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);

  const [promptIA, setPromptIA] = useState('');
  const [promptLux, setPromptLux] = useState('');
  const [promptTech, setPromptTech] = useState('');
  const [sources, setSources] = useState<Source[]>([]);

  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState<DigestCategory>('IA');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [fetchedSettings, fetchedSources] = await Promise.all([
          getSettings(),
          getSources(),
        ]);
        if (!active) return;
        setPromptIA(fetchedSettings.geminiPromptIA);
        setPromptLux(fetchedSettings.geminiPromptLux);
        setPromptTech(fetchedSettings.geminiPromptTech);
        setSources(fetchedSources);
      } catch (err: unknown) {
        if (!active) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Impossible de charger les paramètres depuis le serveur.'
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSavePrompts = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingSettings(true);
    try {
      const updated = await saveSettingsRepo({
        geminiPromptIA: promptIA,
        geminiPromptLux: promptLux,
        geminiPromptTech: promptTech,
      });
      setPromptIA(updated.geminiPromptIA);
      setPromptLux(updated.geminiPromptLux);
      setPromptTech(updated.geminiPromptTech);
      setSuccessMessage('Instructions Gemini sauvegardées avec succès.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la sauvegarde des instructions Gemini.'
      );
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddSource = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAddingSource(true);
    try {
      const created = await createSource({
        name: newSourceName,
        url: newSourceUrl,
        category: newSourceCategory,
      });
      setSources((prev) => [...prev.filter((s) => s.id !== created.id), created]);
      setNewSourceName('');
      setNewSourceUrl('');
      setSuccessMessage('Nouvelle source RSS enregistrée avec succès.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Impossible d'ajouter cette source RSS."
      );
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleToggleSource = async (source: Source) => {
    setErrorMessage(null);
    try {
      const updated = await toggleSourceStatus(source.id, !source.isActive);
      setSources((prev) =>
        prev.map((item) => (item.id === source.id ? updated : item))
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Erreur lors du changement de statut de la source.'
      );
    }
  };

  const handleDeleteSource = async (id: string) => {
    setErrorMessage(null);
    try {
      await removeSource(id);
      setSources((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Erreur lors de la suppression de la source.'
      );
    }
  };

  const cycleCategory = () => {
    const idx = CATEGORIES.indexOf(newSourceCategory);
    const next = CATEGORIES[(idx + 1) % CATEGORIES.length];
    setNewSourceCategory(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
          Paramètres de Veille
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
          Gérez vos sources RSS et les instructions de l&apos;IA (Option B).
        </Text>
      </View>

      {errorMessage ? (
        <View
          testID="error-banner"
          style={[
            styles.banner,
            {
              backgroundColor: colors.dangerSoft,
              borderColor: colors.dangerBorder,
            },
          ]}
        >
          <Text style={[styles.bannerText, { color: colors.danger }]}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {successMessage ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: colors.positiveSoft,
              borderColor: colors.positive,
            },
          ]}
        >
          <Text style={[styles.bannerText, { color: colors.positive }]}>
            {successMessage}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={[styles.loadingLabel, { color: colors.textMuted }]}>
            Chargement de la configuration...
          </Text>
        </View>
      ) : (
        <View style={styles.sectionsWrapper}>
          {/* Section 1 : Prompts Gemini (Instructions) */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              shadows.card,
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Prompts Gemini (Instructions)
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Prompt pour la catégorie &quot;IA&quot;
              </Text>
              <TextInput
                testID="prompt-ia-input"
                value={promptIA}
                onChangeText={setPromptIA}
                multiline
                numberOfLines={4}
                style={[
                  styles.textAreaMonospace,
                  {
                    backgroundColor: colors.mode === 'dark' ? '#0A0A0A' : '#FAFAFA',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Instructions pour la synthèse IA..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Prompt pour la catégorie &quot;Luxembourg&quot;
              </Text>
              <TextInput
                testID="prompt-lux-input"
                value={promptLux}
                onChangeText={setPromptLux}
                multiline
                numberOfLines={4}
                style={[
                  styles.textAreaMonospace,
                  {
                    backgroundColor: colors.mode === 'dark' ? '#0A0A0A' : '#FAFAFA',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Instructions pour la synthèse Luxembourg..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Prompt pour la catégorie &quot;Tech&quot;
              </Text>
              <TextInput
                testID="prompt-tech-input"
                value={promptTech}
                onChangeText={setPromptTech}
                multiline
                numberOfLines={4}
                style={[
                  styles.textAreaMonospace,
                  {
                    backgroundColor: colors.mode === 'dark' ? '#0A0A0A' : '#FAFAFA',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Instructions pour la synthèse Tech..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Pressable
              testID="save-settings-btn"
              onPress={() => {
                handleSavePrompts().catch(() => {});
              }}
              disabled={isSavingSettings}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.brand,
                  opacity: isSavingSettings ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText}>
                {isSavingSettings
                  ? 'Sauvegarde en cours...'
                  : 'Sauvegarder les instructions'}
              </Text>
            </Pressable>
          </View>

          {/* Section 2 : Sources d'actualités (Flux RSS) */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              shadows.card,
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Sources d&apos;actualités (Flux RSS)
            </Text>

            <View style={styles.sourcesList}>
              {sources.length === 0 ? (
                <Text style={[styles.emptySourcesText, { color: colors.textMuted }]}>
                  Aucune source RSS configurée.
                </Text>
              ) : (
                sources.map((source) => (
                  <View
                    key={source.id}
                    style={[
                      styles.sourceCard,
                      isMobile ? styles.sourceCardMobile : styles.sourceCardDesktop,
                      {
                        backgroundColor: colors.mode === 'dark' ? '#0A0A0A' : '#FAFAFA',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.sourceDetails}>
                      <View style={styles.sourceNameRow}>
                        <Text style={[styles.sourceName, { color: colors.textPrimary }]}>
                          {source.name}
                        </Text>
                        <View
                          style={[
                            styles.categoryBadge,
                            {
                              backgroundColor: colors.mode === 'dark' ? '#262626' : '#E5E5E5',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryBadgeText,
                              { color: colors.mode === 'dark' ? '#A3A3A3' : '#525252' },
                            ]}
                          >
                            {source.category}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[styles.sourceUrlText, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {source.url}
                      </Text>
                    </View>

                    <View style={styles.sourceButtonsRow}>
                      <Pressable
                        testID={`toggle-source-${source.id}`}
                        onPress={() => {
                          handleToggleSource(source).catch(() => {});
                        }}
                        style={[
                          styles.toggleBtn,
                          {
                            backgroundColor: source.isActive
                              ? colors.mode === 'dark'
                                ? 'rgba(74, 222, 128, 0.15)'
                                : '#DCFCE7'
                              : colors.mode === 'dark'
                              ? '#262626'
                              : '#E5E5E5',
                          },
                        ]}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.toggleBtnText,
                            {
                              color: source.isActive
                                ? colors.mode === 'dark'
                                  ? '#4ADE80'
                                  : '#15803D'
                                : colors.textMuted,
                            },
                          ]}
                        >
                          {source.isActive ? 'Actif' : 'En pause'}
                        </Text>
                      </Pressable>

                      <Pressable
                        testID={`delete-source-${source.id}`}
                        onPress={() => {
                          handleDeleteSource(source.id).catch(() => {});
                        }}
                        style={styles.deleteBtn}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.deleteBtnText, { color: colors.mode === 'dark' ? '#F87171' : '#EF4444' }]}>
                          Supprimer
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Formulaire d'ajout */}
            <View
              style={[
                styles.addSourceSection,
                { borderTopColor: colors.border },
              ]}
            >
              <Text style={[styles.addSourceHeading, { color: colors.textPrimary }]}>
                Ajouter une nouvelle source
              </Text>

              <View
                style={[
                  styles.addSourceFields,
                  isMobile ? styles.addSourceFieldsMobile : styles.addSourceFieldsDesktop,
                ]}
              >
                <TextInput
                  testID="source-name-input"
                  value={newSourceName}
                  onChangeText={setNewSourceName}
                  placeholder="Nom du site"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: colors.mode === 'dark' ? '#0A0A0A' : '#FAFAFA',
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                />

                <TextInput
                  testID="source-url-input"
                  value={newSourceUrl}
                  onChangeText={setNewSourceUrl}
                  placeholder="URL du flux RSS"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: colors.mode === 'dark' ? '#0A0A0A' : '#FAFAFA',
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                />

                <Pressable
                  testID="source-category-select"
                  onPress={cycleCategory}
                  style={[
                    styles.categorySelect,
                    {
                      backgroundColor: colors.mode === 'dark' ? '#0A0A0A' : '#FAFAFA',
                      borderColor: colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.categorySelectLabel, { color: colors.textPrimary }]}>
                    {newSourceCategory}
                  </Text>
                </Pressable>

                <Pressable
                  testID="add-source-btn"
                  onPress={() => {
                    handleAddSource().catch(() => {});
                  }}
                  disabled={isAddingSource}
                  style={[
                    styles.actionDarkBtn,
                    {
                      backgroundColor: colors.mode === 'dark' ? '#E5E5E5' : '#262626',
                      opacity: isAddingSource ? 0.6 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.actionDarkBtnText,
                      { color: colors.mode === 'dark' ? '#171717' : '#FFFFFF' },
                    ]}
                  >
                    {isAddingSource ? 'Ajout...' : 'Ajouter'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 896, // max-w-4xl (56rem = 896px)
    alignSelf: 'center',
    gap: 40, // space-y-10
  },
  headerBlock: {
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
  },
  banner: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingLabel: {
    fontSize: 14,
  },
  sectionsWrapper: {
    gap: 40,
  },
  card: {
    padding: 24,
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    gap: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  textAreaMonospace: {
    height: 128, // h-32
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    }),
    textAlignVertical: 'top',
  },
  saveBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  sourcesList: {
    gap: 16,
    marginBottom: 32,
  },
  emptySourcesText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  sourceCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
  },
  sourceCardDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceCardMobile: {
    flexDirection: 'column',
  },
  sourceDetails: {
    flex: 1,
    gap: 4,
  },
  sourceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sourceUrlText: {
    fontSize: 14,
    marginTop: 4,
  },
  sourceButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 0,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addSourceSection: {
    borderTopWidth: 1,
    paddingTop: 24,
    marginTop: 8,
    gap: 16,
  },
  addSourceHeading: {
    fontSize: 16,
    fontWeight: '500',
  },
  addSourceFields: {
    gap: spacing.sm,
  },
  addSourceFieldsDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSourceFieldsMobile: {
    flexDirection: 'column',
  },
  formInput: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  categorySelect: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySelectLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionDarkBtn: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionDarkBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
