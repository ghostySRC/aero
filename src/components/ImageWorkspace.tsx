import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Download, Maximize2, X, Sparkles, Ratio } from 'lucide-react-native';
import { ImageGenerationResult } from '../types';

interface ImageWorkspaceProps {
  images: ImageGenerationResult[];
  aspectRatio: string;
  onSelectAspectRatio: (ratio: string) => void;
  isGenerating: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({
  images,
  aspectRatio,
  onSelectAspectRatio,
  isGenerating,
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageGenerationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const ratios = ['1:1', '16:9', '9:16'];

  const handleSaveToCameraRoll = async (imageUrl: string) => {
    try {
      setIsSaving(true);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera roll access is required to export images.');
        setIsSaving(false);
        return;
      }

      const filename = `aero_${Date.now()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadRes = await FileSystem.downloadAsync(imageUrl, fileUri);

      await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
      Alert.alert('Saved!', 'Image successfully exported to Camera Roll.');
    } catch (e: any) {
      Alert.alert('Export Error', e?.message || 'Could not save image to camera roll.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Aspect Ratio Toggles Bar */}
      <View style={styles.ratioBarContainer}>
        <View style={styles.ratioHeader}>
          <Ratio color="#38BDF8" size={14} />
          <Text style={styles.ratioTitle}>Aspect Ratio:</Text>
        </View>
        <View style={styles.ratioButtonsRow}>
          {ratios.map((ratio) => (
            <TouchableOpacity
              key={ratio}
              style={[styles.ratioButton, aspectRatio === ratio && styles.ratioButtonActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectAspectRatio(ratio); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.ratioButtonText, aspectRatio === ratio && styles.ratioButtonTextActive]}>
                {ratio}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generated Images Feed */}
      <ScrollView contentContainerStyle={styles.galleryContainer} showsVerticalScrollIndicator={false}>
        {isGenerating && (
          <View style={styles.generatingCard}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.generatingText}>Synthesizing image prompt...</Text>
          </View>
        )}

        {images.length === 0 && !isGenerating ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Sparkles color="#38BDF8" size={28} />
            </View>
            <Text style={styles.emptyTitle}>Image Synthesis Studio</Text>
            <Text style={styles.emptySubtitle}>
              Select an aspect ratio and enter a descriptive prompt to generate stunning high-fidelity visual assets.
            </Text>
          </View>
        ) : (
          images.map((img) => (
            <View key={img.id} style={styles.imageCard}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSelectedImage(img)}
                style={styles.imageWrapper}
              >
                <ExpoImage
                  source={{ uri: img.url }}
                  style={[
                    styles.imagePreview,
                    img.aspectRatio === '16:9' && { aspectRatio: 16 / 9 },
                    img.aspectRatio === '9:16' && { aspectRatio: 9 / 16 },
                    img.aspectRatio === '1:1' && { aspectRatio: 1 / 1 },
                  ]}
                  contentFit="cover"
                  transition={300}
                />
                <View style={styles.fullscreenBadge}>
                  <Maximize2 color="#FFFFFF" size={14} />
                </View>
              </TouchableOpacity>

              <View style={styles.imageCardFooter}>
                <View style={styles.promptTextWrapper}>
                  <Text style={styles.promptText} numberOfLines={2}>
                    {img.prompt}
                  </Text>
                  <Text style={styles.imageMeta}>
                    {img.aspectRatio} • {img.costUSD ? `$${img.costUSD.toFixed(4)}` : 'Completed'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSaveToCameraRoll(img.url); }}
                  activeOpacity={0.7}
                >
                  <Download color="#38BDF8" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Full-Screen Interactive Preview Modal */}
      {selectedImage && (
        <Modal visible animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.closeOverlayButton} onPress={() => setSelectedImage(null)}>
              <X color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <ExpoImage
              source={{ uri: selectedImage.url }}
              style={styles.fullScreenImage}
              contentFit="contain"
            />

            <View style={styles.fullScreenActionRow}>
              <TouchableOpacity
                style={styles.fullScreenSaveButton}
                onPress={() => handleSaveToCameraRoll(selectedImage.url)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <>
                    <Download color="#000000" size={18} />
                    <Text style={styles.fullScreenSaveText}>Export to Camera Roll</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  ratioBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d0d0d',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  ratioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratioTitle: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '600',
  },
  ratioButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ratioButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#141414',
  },
  ratioButtonActive: {
    backgroundColor: '#38BDF8',
  },
  ratioButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  ratioButtonTextActive: {
    color: '#000000',
  },
  galleryContainer: {
    paddingBottom: 24,
    gap: 16,
  },
  generatingCard: {
    backgroundColor: '#0d0d0d',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  generatingText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18,
  },
  imageCard: {
    backgroundColor: '#0d0d0d',
    borderRadius: 18,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
  },
  fullscreenBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
  },
  imageCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  promptTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  promptText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  imageMeta: {
    color: '#888888',
    fontSize: 11,
  },
  exportButton: {
    backgroundColor: '#141414',
    padding: 10,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeOverlayButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  fullScreenActionRow: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 24,
  },
  fullScreenSaveButton: {
    height: 52,
    backgroundColor: '#38BDF8',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fullScreenSaveText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});