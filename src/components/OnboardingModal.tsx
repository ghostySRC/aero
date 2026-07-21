import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ShieldCheck, Key, ArrowRight, Sparkles } from 'lucide-react-native';
import { fetchKeyDetails } from '../services/openrouter';
import { saveStoredApiKey } from '../services/storage';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';

interface OnboardingModalProps {
  visible: boolean;
  onSuccess: (apiKey: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onSuccess }) => {
  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      cardScale.value = withSpring(1, { damping: 18, stiffness: 120, mass: 0.8 });
      cardOpacity.value = withSpring(1, { damping: 18, stiffness: 120, mass: 0.8 });
    } else {
      cardScale.value = withSpring(0.92, { damping: 18, stiffness: 120, mass: 0.8 });
      cardOpacity.value = withSpring(0, { damping: 18, stiffness: 120, mass: 0.8 });
    }
  }, [visible]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleSaveKey = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setError('Please enter a valid OpenRouter API key.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate key with OpenRouter API
      await fetchKeyDetails(trimmed);
      await saveStoredApiKey(trimmed);
      onSuccess(trimmed);
    } catch (e: any) {
      setError(e?.message || 'Invalid API key or network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.centerCardContainer}>
          <Animated.View style={[styles.glassCard, animatedCardStyle]}>
            <LiquidGlassWrapper effect="prominent" style={styles.glassInner}>
              <View style={styles.iconHeader}>
                <View style={styles.iconCircle}>
                  <Sparkles color="#38BDF8" size={28} />
                </View>
              </View>

              <Text style={styles.title}>Welcome to Aero</Text>
              <Text style={styles.subtitle}>
                Sovereign Client for OpenRouter. Connect your API key to access dynamic multi-modal AI intelligence.
              </Text>

              <View style={styles.inputWrapper}>
                <Key color="#94A3B8" size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="sk-or-v1-..."
                  placeholderTextColor="#64748B"
                  value={inputKey}
                  onChangeText={(text) => {
                    setInputKey(text);
                    if (error) setError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                  pointerEvents="auto"
                />
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSaveKey}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>Authenticate & Continue</Text>
                    <ArrowRight color="#000000" size={18} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.securityFooter}>
                <ShieldCheck color="#10B981" size={14} />
                <Text style={styles.securityText}>Stored on-device via Secure Store</Text>
              </View>
            </LiquidGlassWrapper>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerCardContainer: {
    width: '100%',
    maxWidth: 420,
  },
  glassCard: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glassInner: {
    borderRadius: 24,
    padding: 28,
    backgroundColor: '#0d0d0d',
    borderWidth: 0,
    overflow: 'hidden',
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  saveButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  securityText: {
    fontSize: 12,
    color: '#888888',
  },
});