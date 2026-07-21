import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MessageSquareText, Image as ImageIcon, Video, Search, ChevronRight, SlidersHorizontal } from 'lucide-react-native';
import { Modality, OpenRouterModel } from '../types';

interface SegmentControlProps {
  activeModality: Modality;
  onSelectModality: (mode: Modality) => void;
  selectedModel: OpenRouterModel | null;
  onOpenModelSelector: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const SegmentControl: React.FC<SegmentControlProps> = ({
  activeModality,
  onSelectModality,
  selectedModel,
  onOpenModelSelector,
  searchQuery,
  onSearchQueryChange,
}) => {
  const modes: { id: Modality; label: string; icon: any }[] = [
    { id: 'text', label: 'Text & Reasoning', icon: MessageSquareText },
    { id: 'image', label: 'Image Synthesis', icon: ImageIcon },
    { id: 'video', label: 'Video Production', icon: Video },
  ];

  return (
    <View style={styles.container}>
      {/* Horizontal Sliding Modality Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentBarContainer}
      >
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeModality === mode.id;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectModality(mode.id);
              }}
              activeOpacity={0.8}
            >
              <Icon color={isActive ? '#000000' : '#888888'} size={16} />
              <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Model Selection Trigger & Search */}
      <View style={styles.matrixContainer}>
        <TouchableOpacity
          style={styles.modelSelectorTrigger}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenModelSelector();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.modelTriggerLeft}>
            <SlidersHorizontal color="#38BDF8" size={16} />
            <Text style={styles.modelTriggerTitle} numberOfLines={1}>
              {selectedModel ? selectedModel.name || selectedModel.id : 'Select Model Engine'}
            </Text>
          </View>
          <View style={styles.modelTriggerRight}>
            <Text style={styles.modelTriggerId} numberOfLines={1}>
              {selectedModel ? selectedModel.id.split('/')[1] || selectedModel.id : ''}
            </Text>
            <ChevronRight color="#888888" size={16} />
          </View>
        </TouchableOpacity>

        {/* Sticky Catalog Search Input */}
        <View style={styles.searchBarWrapper}>
          <Search color="#888888" size={16} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Filter ${activeModality} models...`}
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            autoCapitalize="none"
            autoCorrect={false}
            editable={true}
            pointerEvents="auto"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  segmentBarContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  segmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0d0d0d',
  },
  segmentButtonActive: {
    backgroundColor: '#38BDF8',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
  },
  segmentLabelActive: {
    color: '#000000',
  },
  matrixContainer: {
    marginTop: 10,
    gap: 8,
  },
  modelSelectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d0d0d',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modelTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modelTriggerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  modelTriggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modelTriggerId: {
    color: '#888888',
    fontSize: 12,
    maxWidth: 120,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
});