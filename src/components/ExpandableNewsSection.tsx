import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fetchGoFurther } from '../services/aiService';
import { radii, spacing, type ThemeColors } from '../theme/colors';

interface ExpandableNewsSectionProps {
  content: string;
  colors: ThemeColors;
}

interface ParsedBulletItem {
  id: string;
  actionIndex: number | null;
  rawText: string;
  sectionTitle: string;
}

interface ParsedSection {
  title: string;
  isSources: boolean;
  paragraphs: string[];
  bullets: ParsedBulletItem[];
  sectionActionIndex: number | null;
}

function parseMarkdownToSections(markdown: string): ParsedSection[] {
  const chunks = markdown
    .split(/(?=^#{2,3}\s)/m)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  let nextActionIndex = 0;
  const sections: ParsedSection[] = [];

  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunk = chunks[cIdx];
    const lines = chunk.split('\n');
    let title = '';
    const bodyLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (i === 0 && /^#{2,3}\s+/.test(line)) {
        title = line.replace(/^#{2,3}\s+/, '').replace(/\*\*/g, '').trim();
      } else {
        bodyLines.push(lines[i]);
      }
    }

    const isSources = /^sources/i.test(title);
    const paragraphs: string[] = [];
    const bullets: ParsedBulletItem[] = [];

    for (let lIdx = 0; lIdx < bodyLines.length; lIdx++) {
      const trimmed = bodyLines[lIdx].trim();
      if (!trimmed || trimmed === '---') continue;

      if (/^[-*+]\s+/.test(trimmed)) {
        const cleanBullet = trimmed.replace(/^[-*+]\s+/, '').trim();
        const isPureLink = /^\[[^\]]+\]\(https?:\/\/[^)]+\)$/.test(cleanBullet);
        const canExpand = !isSources && !isPureLink;
        const assignedIndex = canExpand ? nextActionIndex++ : null;

        bullets.push({
          id: `sec-${cIdx}-bullet-${lIdx}`,
          actionIndex: assignedIndex,
          rawText: cleanBullet,
          sectionTitle: title,
        });
      } else {
        paragraphs.push(trimmed.replace(/^#+\s+/, ''));
      }
    }

    let sectionActionIndex: number | null = null;
    if (title && !isSources && bullets.length === 0 && paragraphs.length > 0) {
      sectionActionIndex = nextActionIndex++;
    }

    sections.push({
      title,
      isSources,
      paragraphs,
      bullets,
      sectionActionIndex,
    });
  }

  // Garantie qu'au moins un item actionnable porte l'index 0 si le contenu n'est pas vide
  if (nextActionIndex === 0 && sections.length > 0) {
    sections[0].sectionActionIndex = 0;
  }

  return sections;
}

function renderFormattedInlineText(
  text: string,
  colors: ThemeColors
): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={idx} style={[styles.boldText, { color: colors.textPrimary }]}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={idx} style={styles.italicText}>
          {part.slice(1, -1)}
        </Text>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <Text
          key={idx}
          style={[styles.linkText, { color: colors.primary }]}
          onPress={() => {
            Linking.openURL(url).catch(() => {});
          }}
        >
          {label}
        </Text>
      );
    }

    return <Text key={idx}>{part}</Text>;
  });
}

export default function ExpandableNewsSection({
  content,
  colors,
}: ExpandableNewsSectionProps) {
  const sections = useMemo(() => parseMarkdownToSections(content), [content]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [cacheByIndex, setCacheByIndex] = useState<Record<number, string>>({});
  const [errorByIndex, setErrorByIndex] = useState<Record<number, string>>({});

  const handleTriggerGoFurther = async (actionIndex: number, queryText: string) => {
    if (activeIndex === actionIndex && !loadingIndex) {
      setActiveIndex(null);
      return;
    }

    setActiveIndex(actionIndex);

    if (cacheByIndex[actionIndex]) {
      return;
    }

    setLoadingIndex(actionIndex);
    setErrorByIndex((prev) => {
      const next = { ...prev };
      delete next[actionIndex];
      return next;
    });

    try {
      const result = await fetchGoFurther(queryText);
      setCacheByIndex((prev) => ({ ...prev, [actionIndex]: result }));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de générer l'approfondissement IA.";
      setErrorByIndex((prev) => ({ ...prev, [actionIndex]: message }));
    } finally {
      setLoadingIndex(null);
    }
  };

  const renderExpandedCard = (actionIndex: number) => {
    if (activeIndex !== actionIndex) return null;

    const isLoading = loadingIndex === actionIndex;
    const errorMsg = errorByIndex[actionIndex];
    const expandedMarkdown = cacheByIndex[actionIndex];

    const lines = expandedMarkdown
      ? expandedMarkdown
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
      : [];

    return (
      <View
        testID="expanded-details-card"
        style={[
          styles.expandedCard,
          {
            backgroundColor: colors.primarySoft,
            borderColor: colors.primaryBorder,
            borderLeftColor: colors.primary,
          },
        ]}
      >
        <View style={[styles.expandedHeader, { borderBottomColor: colors.primaryBorder }]}>
          <View style={styles.expandedBadgeRow}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 3l1.9 5.8h6.1l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-4.9-3.6h6.1L12 3z"
                stroke={colors.primary}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.expandedBadgeText, { color: colors.primary }]}>
              Approfondissement IA
            </Text>
          </View>

          <Pressable
            testID="expanded-details-close-btn"
            onPress={() => setActiveIndex(null)}
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Fermer l'approfondissement"
          >
            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
              ✕ Fermer
            </Text>
          </Pressable>
        </View>

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.primary }]}>
              Recherche et synthèse en cours...
            </Text>
          </View>
        )}

        {errorMsg && !isLoading && (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.dangerSoft,
                borderColor: colors.dangerBorder,
              },
            ]}
          >
            <Text style={[styles.errorBoxText, { color: colors.danger }]}>{errorMsg}</Text>
          </View>
        )}

        {expandedMarkdown && !isLoading && (
          <View style={styles.expandedBody}>
            {lines.map((line, idx) => {
              const cleaned = line.replace(/^#{1,4}\s+/, '').replace(/^[-*]\s+/, '• ');
              return (
                <Text
                  key={idx}
                  style={[styles.expandedParagraph, { color: colors.textSecondary }]}
                >
                  {renderFormattedInlineText(cleaned, colors)}
                </Text>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {sections.map((section, sIdx) => (
        <View
          key={sIdx}
          style={[
            styles.sectionBlock,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {(section.title || section.sectionActionIndex !== null) && (
            <View style={styles.sectionHeaderRow}>
              {section.title ? (
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {section.title}
                </Text>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              {section.sectionActionIndex !== null && (
                <Pressable
                  testID={`go-further-btn-${section.sectionActionIndex}`}
                  onPress={() =>
                    handleTriggerGoFurther(
                      section.sectionActionIndex!,
                      `${section.title}\n${section.paragraphs.join('\n')}`.trim()
                    )
                  }
                  style={[
                    styles.sparkleButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.primaryBorder,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Aller plus loin"
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 3l1.9 5.8h6.1l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-4.9-3.6h6.1L12 3z"
                      stroke={colors.primary}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={[styles.sparkleButtonLabel, { color: colors.primary }]}>
                    Aller plus loin
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {section.paragraphs.map((p, pIdx) => (
            <Text key={pIdx} style={[styles.paragraph, { color: colors.textSecondary }]}>
              {renderFormattedInlineText(p, colors)}
            </Text>
          ))}

          {section.sectionActionIndex !== null &&
            renderExpandedCard(section.sectionActionIndex)}

          {section.bullets.map((bullet) => {
            const query = bullet.sectionTitle
              ? `Sujet : ${bullet.sectionTitle}\nPoint précis : ${bullet.rawText}`
              : bullet.rawText;

            return (
              <View key={bullet.id} style={styles.bulletBlock}>
                <View style={styles.bulletRow}>
                  <View
                    style={[styles.bulletDot, { backgroundColor: colors.primary }]}
                  />
                  <View style={styles.bulletTextWrapper}>
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                      {renderFormattedInlineText(bullet.rawText, colors)}
                    </Text>

                    {bullet.actionIndex !== null && (
                      <Pressable
                        testID={`go-further-btn-${bullet.actionIndex}`}
                        onPress={() => handleTriggerGoFurther(bullet.actionIndex!, query)}
                        style={[
                          styles.sparkleButton,
                          {
                            backgroundColor:
                              activeIndex === bullet.actionIndex
                                ? colors.primarySoft
                                : colors.surface,
                            borderColor: colors.primaryBorder,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Aller plus loin sur ce point"
                      >
                        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M12 3l1.9 5.8h6.1l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-4.9-3.6h6.1L12 3z"
                            stroke={colors.primary}
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                        </Svg>
                        <Text style={[styles.sparkleButtonLabel, { color: colors.primary }]}>
                          Aller plus loin
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {bullet.actionIndex !== null && renderExpandedCard(bullet.actionIndex)}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionBlock: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  bulletBlock: {
    marginTop: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    marginTop: 8,
  },
  bulletTextWrapper: {
    flex: 1,
    gap: 8,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  sparkleButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  sparkleButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: spacing.sm,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  expandedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  closeButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorBox: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  errorBoxText: {
    fontSize: 12,
    fontWeight: '500',
  },
  expandedBody: {
    gap: 6,
  },
  expandedParagraph: {
    fontSize: 13,
    lineHeight: 20,
  },
});
