import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { syncAll } from '../services/syncService';
import { colors, radius, spacing } from '../theme/colors';
import { credentialsSchema } from '../utils/validation';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AuthModal({ visible, onClose }: AuthModalProps) {
  const { user, isAuthenticated, isLoading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message || 'Informations de connexion invalides.');
      return;
    }

    setIsSubmitting(true);
    try {
      const action = mode === 'signIn' ? signIn : signUp;
      const res = await action(parsed.data.email, parsed.data.password);
      if (!res.success) {
        setErrorMessage(res.error || 'Une erreur est survenue.');
      } else {
        setSuccessMessage(mode === 'signIn' ? 'Connexion réussie.' : 'Compte créé avec succès.');
        if (mode === 'signIn') {
          setTimeout(handleClose, 800);
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await syncAll(user.id);
      if (res.success) {
        setSuccessMessage(res.message || 'Synchronisation terminée.');
      } else {
        setErrorMessage(res.error || 'Erreur lors de la synchronisation.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Échec de synchronisation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      testID="auth-modal"
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {isAuthenticated ? 'Mon compte Veyl' : mode === 'signIn' ? 'Connexion Cloud' : 'Inscription Cloud'}
            </Text>
            <Pressable testID="auth-close-btn" onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {errorMessage && (
            <View style={styles.errorBanner} testID="auth-error-banner">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBanner} testID="auth-success-banner">
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {isAuthenticated ? (
            <View style={styles.connectedSection}>
              <Text style={styles.userEmailText}>Connecté en tant que :</Text>
              <Text style={styles.userEmailValue} testID="auth-user-email">
                {user?.email}
              </Text>

              <Pressable
                testID="sync-now-btn"
                onPress={handleSync}
                disabled={isSubmitting}
                style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Synchroniser maintenant</Text>
                )}
              </Pressable>

              <Pressable
                testID="auth-signout-btn"
                onPress={async () => {
                  await signOut();
                  handleClose();
                }}
                style={styles.signOutBtn}
              >
                <Text style={styles.signOutBtnText}>Se déconnecter</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Adresse e-mail</Text>
              <TextInput
                testID="auth-email-input"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="nom@exemple.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                testID="auth-password-input"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="6 caractères minimum"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />

              <Pressable
                testID="auth-submit-btn"
                onPress={handleSubmit}
                disabled={isSubmitting || isLoading}
                style={[styles.primaryBtn, (isSubmitting || isLoading) && styles.btnDisabled]}
              >
                {isSubmitting || isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {mode === 'signIn' ? 'Se connecter' : 'Créer un compte'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                testID="auth-switch-mode-btn"
                onPress={() => {
                  setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'));
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                style={styles.switchModeBtn}
              >
                <Text style={styles.switchModeText}>
                  {mode === 'signIn'
                    ? "Pas encore de compte ? S'inscrire"
                    : 'Déjà un compte ? Se connecter'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surfaceActive,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positive,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.positive,
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  input: {
    height: 44,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },
  primaryBtn: {
    height: 44,
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  primaryBtnText: {
    color: colors.textOnBrand,
    fontWeight: '700',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  switchModeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchModeText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '600',
  },
  connectedSection: {
    gap: spacing.md,
  },
  userEmailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  userEmailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  signOutBtn: {
    height: 44,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
});
