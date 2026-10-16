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
import { radius, spacing, type ThemeColors } from '../theme/colors';

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
          style={[styles.linkText, { color: colors.brand }]}
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
            borderLeftColor: colors.brand,
          },
        ]}
      >
        <View style={[styles.expandedHeader, { borderBottomColor: colors.primaryBorder }]}>
          <View style={styles.expandedBadgeRow}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                stroke={colors.brand}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.expandedBadgeText, { color: colors.brand }]}>
              Approfondissement IA
            </Text>
          </View>

          <Pressable
            testID="expanded-details-close-btn"
            onPress={() => setActiveIndex(null)}
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
              Fermer
            </Text>
          </Pressable>
        </View>

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.brand} />
            <Text style={[styles.loadingText, { color: colors.brand }]}>
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
        <View key={sIdx} style={styles.sectionBlock}>
          {section.title ? (
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionHeadingText, { color: colors.textPrimary }]}>
                {section.title}
              </Text>
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
                    styles.sparkleBtn,
                    {
                      backgroundColor:
                        activeIndex === section.sectionActionIndex
                          ? colors.primarySoft
                          : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Aller plus loin"
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                      stroke={colors.brand}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Pressable>
              )}
            </View>
          ) : null}

          {section.paragraphs.map((p, pIdx) => (
            <Text key={pIdx} style={[styles.paragraphText, { color: colors.textSecondary }]}>
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
              <View key={bullet.id} style={styles.bulletItem}>
                <View style={styles.bulletContentRow}>
                  <Text style={[styles.bulletDotChar, { color: colors.textMuted }]}>•</Text>
                  <View style={styles.bulletTextAndBtn}>
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                      {renderFormattedInlineText(bullet.rawText, colors)}{' '}
                      {bullet.actionIndex !== null && (
                        <Pressable
                          testID={`go-further-btn-${bullet.actionIndex}`}
                          onPress={() => handleTriggerGoFurther(bullet.actionIndex!, query)}
                          style={[
                            styles.inlineSparkleBtn,
                            {
                              backgroundColor:
                                activeIndex === bullet.actionIndex
                                  ? colors.primarySoft
                                  : colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Aller plus loin"
                        >
                          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                              stroke={colors.brand}
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </Pressable>
                      )}
                    </Text>
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
    gap: spacing.lg,
  },
  sectionBlock: {
    marginBottom: spacing.md,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeadingText: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  paragraphText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  bulletItem: {
    marginVertical: 4,
  },
  bulletContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDotChar: {
    fontSize: 18,
    lineHeight: 22,
  },
  bulletTextAndBtn: {
    flex: 1,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 24,
  },
  inlineSparkleBtn: {
    display: 'inline-flex' as any,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 6,
    borderRadius: 6,
    borderWidth: 1,
    verticalAlign: 'middle',
  },
  sparkleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  expandedCard: {
    marginTop: 10,
    marginBottom: 8,
    padding: spacing.md,
    borderRadius: radius.sm, // 12
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
    borderRadius: 6,
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
