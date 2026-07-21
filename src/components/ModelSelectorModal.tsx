import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Check, Zap, Cpu, Sparkles } from 'lucide-react-native';
import { OpenRouterModel, Modality } from '../types';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';

interface ModelSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  models: OpenRouterModel[];
  selectedModel: OpenRouterModel | null;
  onSelectModel: (model: OpenRouterModel) => void;
  activeModality: Modality;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  visible,
  onClose,
  models,
  selectedModel,
  onSelectModel,
  activeModality,
}) => {
  const slideUp = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideUp.value = withSpring(1, { damping: 18, stiffness: 120, mass: 0.8 });
    } else {
      slideUp.value = withSpring(0, { damping: 18, stiffness: 120, mass: 0.8 });
    }
  }, [visible]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - slideUp.value) * 300 }],
    opacity: slideUp.value,
  }));

  const renderModelItem = ({ item }: { item: OpenRouterModel }) => {
    const isSelected = selectedModel?.id === item.id;
    const promptPrice = item.pricing?.prompt
      ? typeof item.pricing.prompt === 'string'
        ? (parseFloat(item.pricing.prompt) * 1000000).toFixed(2)
        : (item.pricing.prompt * 1000000).toFixed(2)
      : '0.00';

    const completionPrice = item.pricing?.completion
      ? typeof item.pricing.completion === 'string'
        ? (parseFloat(item.pricing.completion) * 1000000).toFixed(2)
        : (item.pricing.completion * 1000000).toFixed(2)
      : '0.00';

    return (
      <TouchableOpacity
        style={[styles.modelCard, isSelected && styles.modelCardSelected]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelectModel(item);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.modelHeaderRow}>
          <View style={styles.modelTitleGroup}>
            <Cpu color={isSelected ? '#38BDF8' : '#888888'} size={18} />
            <Text style={styles.modelName}>{item.name || item.id}</Text>
          </View>
          {isSelected && <Check color="#38BDF8" size={18} />}
        </View>

        <Text style={styles.modelSlug}>{item.id}</Text>

        {item.description ? (
          <Text style={styles.modelDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.modelMetaRow}>
          {item.context_length ? (
            <View style={styles.metaBadge}>
              <Zap color="#EAB308" size={10} />
              <Text style={styles.metaBadgeText}>{Math.round(item.context_length / 1000)}k Context</Text>
            </View>
          ) : null}

          <Text style={styles.pricingText}>
            ${promptPrice} / ${completionPrice} per 1M tokens
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.modalContentWrapper, animatedModalStyle]}>
            <LiquidGlassWrapper effect="regular" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.headerTitleGroup}>
                  <Sparkles color="#38BDF8" size={20} />
                  <Text style={styles.modalTitle}>
                    Select {activeModality.toUpperCase()} Model ({models.length})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} style={styles.closeButton}>
                  <X color="#888888" size={20} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={models}
                keyExtractor={(item) => item.id}
                renderItem={renderModelItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No matching {activeModality} models found.</Text>
                  </View>
                }
              />
            </LiquidGlassWrapper>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    height: '85%',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#0d0d0d',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 6,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  modelCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 14,
  },
  modelCardSelected: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  modelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modelTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modelName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  modelSlug: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 6,
  },
  modelDesc: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 16,
    marginBottom: 8,
  },
  modelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 10,
    color: '#EAB308',
    fontWeight: '600',
  },
  pricingText: {
    fontSize: 11,
    color: '#888888',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
  },
});