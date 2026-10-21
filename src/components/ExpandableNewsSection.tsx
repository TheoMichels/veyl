import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { fetchGoFurther } from '../services/aiService';
import { spacing, type ThemeColors } from '../theme/colors';

interface ExpandableNewsSectionProps {
  content: string;
  colors: ThemeColors;
}

function LucideSparkles({
  size = 14,
  color,
  isFilled = false,
  fillColor,
}: {
  size?: number;
  color: string;
  isFilled?: boolean;
  fillColor?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path
        d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
        fill={isFilled ? (fillColor || (color === '#6366F1' ? '#EEF2FF' : 'rgba(49, 46, 129, 0.5)')) : 'none'}
      />
      <Path d="M20 2v4" />
      <Path d="M22 4h-4" />
      <Circle cx={4} cy={20} r={2} fill={isFilled ? (fillColor || color) : 'none'} />
    </Svg>
  );
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

  const getActionBtnAppearance = (actionIndex: number) => {
    const isOpen = activeIndex === actionIndex;
    const hasCachedContent = Boolean(cacheByIndex[actionIndex]);

    if (isOpen) {
      return {
        backgroundColor: colors.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF',
        borderColor: colors.brand,
        borderWidth: 1,
        iconColor: colors.brand,
        isFilled: true,
        fillColor: colors.mode === 'dark' ? 'rgba(99, 102, 241, 0.4)' : '#EEF2FF',
        accessibilityLabel: "Masquer l'approfondissement IA",
      };
    }

    if (hasCachedContent) {
      // Texte masqué mais toujours en cache / stocké sur la page : bouton violet
      return {
        backgroundColor: colors.mode === 'dark' ? 'rgba(139, 92, 246, 0.16)' : '#F5F3FF',
        borderColor: colors.mode === 'dark' ? 'rgba(139, 92, 246, 0.45)' : '#DDD6FE',
        borderWidth: 1,
        iconColor: colors.accentViolet,
        isFilled: true,
        fillColor: colors.mode === 'dark' ? 'rgba(139, 92, 246, 0.4)' : '#EDE9FE',
        accessibilityLabel: "Afficher l'approfondissement IA (déjà généré)",
      };
    }

    return {
      backgroundColor: colors.surface,
      borderColor: 'transparent',
      borderWidth: 1,
      iconColor: colors.textMuted,
      isFilled: false,
      fillColor: undefined,
      accessibilityLabel: "Approfondir avec l'IA",
    };
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

    const cardBg =
      colors.mode === 'dark' ? 'rgba(30, 27, 75, 0.25)' : '#F8FAFC';
    const cardBorder =
      colors.mode === 'dark' ? 'rgba(49, 46, 129, 0.5)' : '#E0E7FF';
    const cardBorderLeft =
      colors.mode === 'dark' ? '#818CF8' : '#6366F1';
    const headerBorder =
      colors.mode === 'dark'
        ? 'rgba(55, 48, 163, 0.3)'
        : 'rgba(224, 231, 255, 0.7)';

    return (
      <View
        testID="expanded-details-card"
        style={[
          styles.expandedCard,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderLeftColor: cardBorderLeft,
          },
        ]}
      >
        <View style={[styles.expandedHeader, { borderBottomColor: headerBorder }]}>
          <View style={styles.expandedBadgeRow}>
            <LucideSparkles
              size={14}
              color={cardBorderLeft}
              isFilled={true}
              fillColor={colors.mode === 'dark' ? 'rgba(49, 46, 129, 0.5)' : '#EEF2FF'}
            />
            <Text style={[styles.expandedBadgeText, { color: colors.mode === 'dark' ? '#A5B4FC' : '#4338CA' }]}>
              Approfondissement IA
            </Text>
          </View>

          <Pressable
            testID="expanded-details-close-btn"
            onPress={() => setActiveIndex(null)}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.closeButtonText, { color: colors.textMuted }]}>
              Fermer
            </Text>
          </Pressable>
        </View>

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={cardBorderLeft} />
            <Text style={[styles.loadingText, { color: cardBorderLeft }]}>
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
              {section.sectionActionIndex !== null && (() => {
                const btnState = getActionBtnAppearance(section.sectionActionIndex);
                return (
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
                        backgroundColor: btnState.backgroundColor,
                        borderColor: btnState.borderColor,
                        borderWidth: btnState.borderWidth,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={btnState.accessibilityLabel}
                    accessibilityState={{ expanded: activeIndex === section.sectionActionIndex }}
                  >
                    <LucideSparkles
                      size={16}
                      color={btnState.iconColor}
                      isFilled={btnState.isFilled}
                      fillColor={btnState.fillColor}
                    />
                  </Pressable>
                );
              })()}
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
                      {bullet.actionIndex !== null && (() => {
                        const btnState = getActionBtnAppearance(bullet.actionIndex);
                        return (
                          <Pressable
                            testID={`go-further-btn-${bullet.actionIndex}`}
                            onPress={() => handleTriggerGoFurther(bullet.actionIndex!, query)}
                            style={[
                              styles.inlineSparkleBtn,
                              {
                                backgroundColor: btnState.backgroundColor,
                                borderColor: btnState.borderColor,
                                borderWidth: btnState.borderWidth,
                              },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={btnState.accessibilityLabel}
                            accessibilityState={{ expanded: activeIndex === bullet.actionIndex }}
                          >
                            <LucideSparkles
                              size={14}
                              color={btnState.iconColor}
                              isFilled={btnState.isFilled}
                              fillColor={btnState.fillColor}
                            />
                          </Pressable>
                        );
                      })()}
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
    marginTop: 20,
    marginBottom: 12,
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
    ...(Platform.OS === 'web'
      ? ({
          display: 'inline-flex',
          verticalAlign: 'middle',
          marginLeft: 6,
          transform: [{ translateY: -1 }],
          cursor: 'pointer',
        } as any)
      : {
          marginLeft: 6,
        }),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  sparkleBtn: {
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
        } as any)
      : {}),
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
    marginTop: 14,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 8,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  expandedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0,
  },
  closeButtonText: {
    fontSize: 11,
    fontWeight: '500',
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
    fontSize: 14,
    lineHeight: 22,
  },
});
