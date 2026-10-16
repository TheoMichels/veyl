import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
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
import { radii, spacing, shadows, type ThemeColors } from '../theme/colors';
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
          Gérez vos sources RSS et personnalisez les instructions d&apos;analyse Gemini.
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
              backgroundColor: colors.successSoft,
              borderColor: colors.success,
            },
          ]}
        >
          <Text style={[styles.bannerText, { color: colors.success }]}>
            {successMessage}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingLabel, { color: colors.textMuted }]}>
            Chargement de la configuration...
          </Text>
        </View>
      ) : (
        <>
          {/* Section 1 : Prompts Gemini */}
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
                Prompt pour la catégorie « IA »
              </Text>
              <TextInput
                testID="prompt-ia-input"
                value={promptIA}
                onChangeText={setPromptIA}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceMuted,
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
                Prompt pour la catégorie « Luxembourg »
              </Text>
              <TextInput
                testID="prompt-lux-input"
                value={promptLux}
                onChangeText={setPromptLux}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceMuted,
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
                Prompt pour la catégorie « Tech »
              </Text>
              <TextInput
                testID="prompt-tech-input"
                value={promptTech}
                onChangeText={setPromptTech}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceMuted,
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
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSavingSettings ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>
                {isSavingSettings
                  ? 'Sauvegarde en cours...'
                  : 'Sauvegarder les instructions'}
              </Text>
            </Pressable>
          </View>

          {/* Section 2 : Sources RSS */}
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
                  Aucune source RSS configurée. Ajoutez votre premier flux ci-dessous.
                </Text>
              ) : (
                sources.map((source) => (
                  <View
                    key={source.id}
                    style={[
                      styles.sourceRow,
                      isMobile ? styles.sourceRowMobile : styles.sourceRowDesktop,
                      {
                        backgroundColor: colors.surfaceMuted,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.sourceInfo}>
                      <View style={styles.sourceTitleLine}>
                        <Text style={[styles.sourceName, { color: colors.textPrimary }]}>
                          {source.name}
                        </Text>
                        <View
                          style={[
                            styles.categoryPill,
                            {
                              backgroundColor: colors.primarySoft,
                              borderColor: colors.primaryBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.categoryPillText, { color: colors.primary }]}>
                            {source.category}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[styles.sourceUrl, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {source.url}
                      </Text>
                    </View>

                    <View style={styles.sourceActions}>
                      <Pressable
                        testID={`toggle-source-${source.id}`}
                        onPress={() => {
                          handleToggleSource(source).catch(() => {});
                        }}
                        style={[
                          styles.statusBadgeBtn,
                          {
                            backgroundColor: source.isActive
                              ? colors.successSoft
                              : colors.surface,
                            borderColor: source.isActive ? colors.success : colors.border,
                          },
                        ]}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: source.isActive ? colors.success : colors.textMuted,
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
                        style={[
                          styles.deleteBtn,
                          {
                            backgroundColor: colors.dangerSoft,
                            borderColor: colors.dangerBorder,
                          },
                        ]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.deleteBtnText, { color: colors.danger }]}>
                          Supprimer
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Formulaire d'ajout de source */}
            <View
              style={[
                styles.addSourceBlock,
                { borderTopColor: colors.border },
              ]}
            >
              <Text style={[styles.addSourceTitle, { color: colors.textPrimary }]}>
                Ajouter une nouvelle source
              </Text>

              <View
                style={[
                  styles.addSourceForm,
                  isMobile ? styles.addSourceFormMobile : styles.addSourceFormDesktop,
                ]}
              >
                <TextInput
                  testID="source-name-input"
                  value={newSourceName}
                  onChangeText={setNewSourceName}
                  placeholder="Nom du site"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                />

                <TextInput
                  testID="source-url-input"
                  value={newSourceUrl}
                  onChangeText={setNewSourceUrl}
                  placeholder="URL du flux RSS (https://...)"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                />

                <Pressable
                  testID="source-category-select"
                  onPress={cycleCategory}
                  style={[
                    styles.categorySelectBtn,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Catégorie de la source"
                >
                  <Text style={[styles.categorySelectText, { color: colors.textPrimary }]}>
                    Catégorie : {newSourceCategory}
                  </Text>
                </Pressable>

                <Pressable
                  testID="add-source-btn"
                  onPress={() => {
                    handleAddSource().catch(() => {});
                  }}
                  disabled={isAddingSource}
                  style={[
                    styles.addBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: isAddingSource ? 0.7 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.addBtnText}>
                    {isAddingSource ? 'Ajout...' : 'Ajouter'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  headerBlock: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  pageSubtitle: {
    fontSize: 14,
  },
  banner: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingLabel: {
    fontSize: 13,
  },
  card: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 96,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    borderRadius: radii.md,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sourcesList: {
    gap: spacing.sm,
  },
  emptySourcesText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  sourceRow: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  sourceRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceRowMobile: {
    flexDirection: 'column',
  },
  sourceInfo: {
    flex: 1,
    gap: 4,
  },
  sourceTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sourceUrl: {
    fontSize: 12,
  },
  sourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadgeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addSourceBlock: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  addSourceTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  addSourceForm: {
    gap: spacing.sm,
  },
  addSourceFormDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSourceFormMobile: {
    flexDirection: 'column',
  },
  input: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 13,
  },
  categorySelectBtn: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  categorySelectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
