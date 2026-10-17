import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, gradient, radius, shadows, spacing } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../config/supabase';
import { credentialsSchema } from '../utils/validation';

const cursorPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

export function AuthScreen(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { signIn, signUp, isLoading: isAuthLoading } = useAuth();

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (newMode: 'signIn' | 'signUp') => {
    setMode(newMode);
    setFeedbackError(null);
    setFeedbackSuccess(null);
  };

  const handleSubmit = async () => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!isSupabaseConfigured) {
      setFeedbackError(
        'Configuration Supabase requise : veuillez renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans votre fichier .env'
      );
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setFeedbackError('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    const parseResult = credentialsSchema.safeParse({ email: cleanEmail, password });
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      setFeedbackError(issue?.message || 'Saisissez une adresse email valide et un mot de passe de 6 caractères minimum.');
      return;
    }

    if (mode === 'signUp' && password !== confirmPassword) {
      setFeedbackError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'signIn') {
      const result = await signIn(cleanEmail, password);
      setIsSubmitting(false);

      if (!result.success) {
        setFeedbackError(result.error || 'Échec de connexion. Vérifiez vos identifiants.');
      } else {
        setFeedbackSuccess('Connexion réussie ! Chargement de vos données de veille...');
      }
    } else {
      const result = await signUp(cleanEmail, password);
      setIsSubmitting(false);

      if (!result.success) {
        setFeedbackError(result.error || "Échec de l'inscription. Veuillez réessayer.");
      } else {
        setFeedbackSuccess(
          'Compte créé avec succès ! Si la confirmation par email est requise, vérifiez votre boîte de réception.'
        );
      }
    }
  };

  const isBusy = isSubmitting || isAuthLoading;

  const brandGradientStyle: StyleProp<TextStyle> =
    Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(to right, #4F46E5, #9333EA)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        } as unknown as TextStyle)
      : { color: '#4F46E5' };

  return (
    <LinearGradient
      testID="auth-screen"
      colors={gradient.colors}
      locations={gradient.locations}
      start={gradient.start}
      end={gradient.end}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isMobile && styles.cardMobile]}>
            {/* Header Veyl : Logo Radar, Titre & Sous-titre */}
            <View style={styles.brandHeader}>
              <LinearGradient
                colors={['#6366F1', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBadge}
              >
                {/* Lucide Radar SVG */}
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19.07 4.93A10 10 0 0 0 6.99 3.34"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M4 6h.01"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M2.29 9.62A10 10 0 1 0 21.31 8.35"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M16.24 7.76A6 6 0 1 0 8.23 16.64"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M12 12l4.5-4.5"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </Svg>
              </LinearGradient>
              <Text style={[styles.brandTitle, brandGradientStyle]}>Veyl</Text>
              <Text style={styles.brandSubtitle}>Veille Stratégique & Technologique</Text>
              <Text style={styles.brandDescription}>
                Espace de veille professionnelle sécurisé. Connectez-vous pour accéder à vos
                synthèses quotidiennes et configurer vos flux RSS.
              </Text>
            </View>

            {/* Alerte si Supabase non configuré */}
            {!isSupabaseConfigured && (
              <View style={styles.unconfiguredBox} testID="auth-unconfigured-banner">
                <View style={styles.unconfiguredHeader}>
                  <Text style={styles.unconfiguredIcon}>⚠️</Text>
                  <Text style={styles.unconfiguredTitle}>Configuration Supabase requise</Text>
                </View>
                <Text style={styles.unconfiguredMessage}>
                  Veuillez renseigner <Text style={styles.codeText}>EXPO_PUBLIC_SUPABASE_URL</Text>{' '}
                  et <Text style={styles.codeText}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text> dans votre
                  fichier <Text style={styles.codeText}>.env</Text>.
                </Text>
              </View>
            )}

            {/* Bannières Feedback Erreur / Succès */}
            {feedbackError && (
              <View style={styles.errorBanner} testID="auth-error-banner">
                <Text style={styles.errorBannerText}>{feedbackError}</Text>
              </View>
            )}

            {feedbackSuccess && (
              <View style={styles.successBanner} testID="auth-success-banner">
                <Text style={styles.successBannerText}>{feedbackSuccess}</Text>
              </View>
            )}

            {/* Onglets Connexion / Créer un compte */}
            <View style={styles.tabContainer}>
              <Pressable
                testID="auth-tab-signin"
                style={[
                  styles.tabButton,
                  cursorPointer,
                  mode === 'signIn' && styles.tabButtonActive,
                ]}
                onPress={() => handleTabChange('signIn')}
                disabled={isBusy}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'signIn' }}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    mode === 'signIn' && styles.tabButtonTextActive,
                  ]}
                >
                  Connexion
                </Text>
              </Pressable>

              <Pressable
                testID="auth-tab-signup"
                style={[
                  styles.tabButton,
                  cursorPointer,
                  mode === 'signUp' && styles.tabButtonActive,
                ]}
                onPress={() => handleTabChange('signUp')}
                disabled={isBusy}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'signUp' }}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    mode === 'signUp' && styles.tabButtonTextActive,
                  ]}
                >
                  Créer un compte
                </Text>
              </Pressable>
            </View>

            {/* Formulaire d'authentification */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adresse Email</Text>
                <TextInput
                  testID="auth-email-input"
                  style={styles.input}
                  placeholder="nom@exemple.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <TextInput
                  testID="auth-password-input"
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isBusy}
                />
              </View>

              {mode === 'signUp' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                  <TextInput
                    testID="auth-confirm-password-input"
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isBusy}
                  />
                </View>
              )}

              {/* Bouton de Soumission */}
              <Pressable
                testID="auth-submit-btn"
                style={[
                  styles.submitButton,
                  cursorPointer,
                  isBusy && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isBusy}
                accessibilityRole="button"
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" testID="auth-submit-spinner" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === 'signIn' ? 'Se connecter' : 'Créer mon compte'}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Note de sécurité */}
            <View style={styles.securityFooter}>
              <Text style={styles.securityText}>
                🔒 Authentification chiffrée de bout en bout via Supabase
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    gap: spacing.lg,
    ...shadows.lg,
  },
  cardMobile: {
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  brandHeader: {
    alignItems: 'center',
    gap: 6,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand,
    letterSpacing: 0.2,
  },
  brandDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  unconfiguredBox: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    borderRadius: radius.md,
    padding: 14,
    gap: 6,
  },
  unconfiguredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unconfiguredIcon: {
    fontSize: 16,
  },
  unconfiguredTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warning,
  },
  unconfiguredMessage: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  codeText: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#92400E',
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorBannerText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: colors.positiveSoft,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  successBannerText: {
    fontSize: 12,
    color: colors.positive,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
    padding: 4,
    borderRadius: radius.md,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.primaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  submitButton: {
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...shadows.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  securityFooter: {
    alignItems: 'center',
    marginTop: 4,
  },
  securityText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
