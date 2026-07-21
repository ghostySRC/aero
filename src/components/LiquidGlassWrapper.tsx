import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

let LiquidGlassViewNative: any = null;
try {
  // Dynamically import @callstack/liquid-glass if native module is linked
  const liquidGlassModule = require('@callstack/liquid-glass');
  LiquidGlassViewNative = liquidGlassModule.LiquidGlassView;
} catch (e) {
  // Fallback to BlurView or styled container
}

interface LiquidGlassWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  effect?: 'regular' | 'prominent';
}

export const LiquidGlassWrapper: React.FC<LiquidGlassWrapperProps> = ({
  children,
  style,
  effect = 'regular',
}) => {
  if (LiquidGlassViewNative && Platform.OS === 'ios') {
    return (
      <LiquidGlassViewNative effect={effect} style={[styles.glassBase, style]}>
        {children}
      </LiquidGlassViewNative>
    );
  }

  return (
    <View style={[styles.containerFallback, style]}>
      <BlurView tint="dark" intensity={effect === 'prominent' ? 90 : 70} style={StyleSheet.absoluteFillObject} />
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  glassBase: {
    overflow: 'hidden',
    borderBottomWidth: 0,
  },
  containerFallback: {
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 13, 13, 0.85)',
    borderWidth: 0,
  },
  contentContainer: {
    zIndex: 1,
  },
});