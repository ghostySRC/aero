import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowUp, Sparkles } from 'lucide-react-native';
import { Modality } from '../types';

interface PillInputProps {
  activeModality: Modality;
  onSend: (text: string) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const PillInput: React.FC<PillInputProps> = ({
  activeModality,
  onSend,
  isGenerating,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    };
  });

  const handleFocus = () => {
    scale.value = withSpring(1.02, { damping: 18, stiffness: 120, mass: 0.8 });
    translateY.value = withSpring(-4, { damping: 18, stiffness: 120, mass: 0.8 });
  };

  const handleBlur = () => {
    scale.value = withSpring(1.0, { damping: 18, stiffness: 120, mass: 0.8 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 120, mass: 0.8 });
  };

  const handleSendPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmed = text.trim();
    if (!trimmed || isGenerating || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const getPlaceholder = () => {
    switch (activeModality) {
      case 'text':
        return 'Ask Aero anything...';
      case 'image':
        return 'Describe the image to synthesize...';
      case 'video':
        return 'Describe the motion scene to generate...';
    }
  };

  return (
    <View style={styles.outerContainer}>
      <Animated.View style={[styles.pillContainer, animatedStyle]}>
        {/* Radial gradient highlight overlay */}
        <View style={styles.pillGlowHighlight} />
        <Sparkles color="#38BDF8" size={18} style={styles.sparkleIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={getPlaceholder()}
          placeholderTextColor="#888888"
          value={text}
          onChangeText={setText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline
          maxLength={4000}
          editable={true}
          pointerEvents="auto"
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!text.trim() || isGenerating || disabled) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendPress}
          disabled={!text.trim() || isGenerating || disabled}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <ArrowUp color="#000000" size={18} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    // Zero-gravity depth shadow
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  pillGlowHighlight: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  sparkleIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
});