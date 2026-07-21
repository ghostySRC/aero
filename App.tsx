import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getStoredApiKey, getStoredCostLedger, saveStoredCostLedger } from './src/services/storage';
import {
  fetchKeyDetails,
  fetchModels,
  sendChatCompletion,
  generateImage,
  requestVideoGeneration,
  checkVideoStatus,
} from './src/services/openrouter';
import { calculateInteractionCost } from './src/services/costCalculator';
import {
  Modality,
  OpenRouterModel,
  KeyDetails,
  CostLedgerEntry,
  ChatMessage,
  ImageGenerationResult,
  VideoJob,
} from './src/types';
import { LiquidGlassWrapper } from './src/components/LiquidGlassWrapper';
import { TelemetryBanner } from './src/components/TelemetryBanner';
import { SegmentControl } from './src/components/SegmentControl';
import { ModelSelectorModal } from './src/components/ModelSelectorModal';
import { TextWorkspace } from './src/components/TextWorkspace';
import { ImageWorkspace } from './src/components/ImageWorkspace';
import { VideoWorkspace } from './src/components/VideoWorkspace';
import { PillInput } from './src/components/PillInput';
import { OnboardingModal } from './src/components/OnboardingModal';

export default function App() {
  // Key Management State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Financial Telemetry State
  const [keyDetails, setKeyDetails] = useState<KeyDetails | null>(null);
  const [costLedger, setCostLedger] = useState<CostLedgerEntry[]>([]);
  const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState(false);

  // Models & Routing State
  const [allModels, setAllModels] = useState<OpenRouterModel[]>([]);
  const [activeModality, setActiveModality] = useState<Modality>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModelSelectorVisible, setIsModelSelectorVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<OpenRouterModel | null>(null);

  // Workspaces State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [generatedImages, setGeneratedImages] = useState<ImageGenerationResult[]>([]);
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');

  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');

  const [isGenerating, setIsGenerating] = useState(false);

  // Spring animated values for keyboard-aware layout
  const keyboardOffset = useSharedValue(0);

  // Polling ref for video jobs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Boot Initializer
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const storedKey = await getStoredApiKey();
        const storedLedger = await getStoredCostLedger();
        setCostLedger(storedLedger);

        if (storedKey) {
          setApiKey(storedKey);
          await refreshTelemetry(storedKey);
          await loadCatalog(storedKey);
        } else {
          setIsOnboardingVisible(true);
        }
      } catch (e) {
        console.warn('Initialization error:', e);
        setIsOnboardingVisible(true);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // 2. Refresh Key Telemetry
  const refreshTelemetry = async (keyToUse?: string) => {
    const currentKey = keyToUse || apiKey;
    if (!currentKey) return;

    setIsRefreshingTelemetry(true);
    try {
      const details = await fetchKeyDetails(currentKey);
      setKeyDetails(details);
    } catch (e) {
      console.warn('Telemetry sync failed:', e);
    } finally {
      setIsRefreshingTelemetry(false);
    }
  };

  // 3. Load Models Catalog
  const loadCatalog = async (keyToUse?: string) => {
    try {
      const models = await fetchModels(keyToUse || apiKey || undefined);
      setAllModels(models);

      // Auto-select default model for active modality if none selected
      if (!selectedModel && models.length > 0) {
        const defaultText = models.find((m) => m.id.includes('gemini') || m.id.includes('gpt-4') || m.id.includes('claude')) || models[0];
        setSelectedModel(defaultText);
      }
    } catch (e) {
      console.warn('Catalog load failed:', e);
    }
  };

  // 4. Onboarding Complete Handler
  const handleOnboardingSuccess = async (newKey: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setApiKey(newKey);
    setIsOnboardingVisible(false);
    await refreshTelemetry(newKey);
    await loadCatalog(newKey);
  };

  // 5. Dynamic Catalog Filtering Matrix
  const filteredModels = useMemo(() => {
    let list = allModels;

    // Modality filtering rules
    if (activeModality === 'text') {
      list = list.filter((m) => {
        const id = m.id.toLowerCase();
        const mod = m.architecture?.modality?.toLowerCase() || '';
        return (
          mod.includes('text') ||
          id.includes('gpt') ||
          id.includes('claude') ||
          id.includes('gemini') ||
          id.includes('llama') ||
          id.includes('deepseek') ||
          id.includes('mistral') ||
          id.includes('qwen')
        );
      });
    } else if (activeModality === 'image') {
      list = list.filter((m) => {
        const id = m.id.toLowerCase();
        const mod = m.architecture?.modality?.toLowerCase() || '';
        return (
          mod.includes('image') ||
          id.includes('image') ||
          id.includes('dall-e') ||
          id.includes('flux') ||
          id.includes('stable-diffusion') ||
          id.includes('midjourney') ||
          id.includes('imagen')
        );
      });
    } else if (activeModality === 'video') {
      list = list.filter((m) => {
        const id = m.id.toLowerCase();
        const mod = m.architecture?.modality?.toLowerCase() || '';
        return (
          mod.includes('video') ||
          id.includes('kling') ||
          id.includes('veo') ||
          id.includes('hailuo') ||
          id.includes('seedance') ||
          id.includes('runway') ||
          id.includes('sora') ||
          id.includes('luma')
        );
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => m.id.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q)));
    }

    return list;
  }, [allModels, activeModality, searchQuery]);

  // Update selected model when changing modalities if current model doesn't match filter
  useEffect(() => {
    if (filteredModels.length > 0) {
      const exists = filteredModels.some((m) => m.id === selectedModel?.id);
      if (!exists) {
        setSelectedModel(filteredModels[0]);
      }
    }
  }, [activeModality, filteredModels]);

  // 6. Record Cost Ledger Entry & Refresh Telemetry
  const recordCostAndSync = async (
    modelId: string,
    modality: Modality,
    usage: any,
    promptSnippet: string
  ) => {
    const costUSD = calculateInteractionCost(usage, selectedModel || undefined);
    const entry: CostLedgerEntry = {
      id: `cost_${Date.now()}`,
      timestamp: Date.now(),
      modelId,
      modality,
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      reasoningTokens: usage?.reasoning_tokens || 0,
      costUSD,
      promptSnippet,
    };

    const updated = [entry, ...costLedger];
    setCostLedger(updated);
    await saveStoredCostLedger(updated);
    await refreshTelemetry();

    return costUSD;
  };

  // 7. Video Polling Engine (Every 15s)
  useEffect(() => {
    const activePollingJobs = videoJobs.filter((j) => j.status === 'queued' || j.status === 'processing');

    if (activePollingJobs.length > 0 && apiKey) {
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(async () => {
          setVideoJobs((prevJobs) => {
            const pending = prevJobs.filter((j) => j.status === 'queued' || j.status === 'processing');
            if (pending.length === 0 && pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            return prevJobs;
          });

          // Check each pending job
          for (const job of activePollingJobs) {
            try {
              const res = await checkVideoStatus(apiKey, job.id);
              setVideoJobs((prev) =>
                prev.map((item) =>
                  item.id === job.id
                    ? {
                        ...item,
                        status: res.status,
                        videoUrl: res.videoUrl || item.videoUrl,
                        progress: res.progress !== undefined ? res.progress : item.progress,
                        error: res.error || item.error,
                      }
                    : item
                )
              );

              if (res.status === 'completed') {
                await refreshTelemetry();
              }
            } catch (e) {
              console.warn(`Video job ${job.id} check error:`, e);
            }
          }
        }, 15000); // 15-second loop as required
      }
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [videoJobs, apiKey]);

  // 8. Main Send Handler (Text, Image, Video)
  const handleSendPrompt = async (promptText: string) => {
    if (!apiKey) {
      setIsOnboardingVisible(true);
      return;
    }

    const targetModel = selectedModel?.id || 'google/gemini-2.5-flash';
    setIsGenerating(true);

    try {
      if (activeModality === 'text') {
        const userMsg: ChatMessage = {
          id: `msg_${Date.now()}_u`,
          role: 'user',
          content: promptText,
          timestamp: Date.now(),
        };

        const assistantMsgId = `msg_${Date.now()}_a`;
        const initialAssistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          modelId: targetModel,
          isStreaming: true,
        };

        const updatedMessages = [...chatMessages, userMsg, initialAssistantMsg];
        setChatMessages(updatedMessages);

        const conversationPayload = updatedMessages
          .filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role, content: m.content }));

        const result = await sendChatCompletion(
          apiKey,
          targetModel,
          conversationPayload,
          (delta) => {
            setChatMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: msg.content + delta }
                  : msg
              )
            );
          }
        );

        const costUSD = await recordCostAndSync(targetModel, 'text', result.usage, promptText);

        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: result.text || msg.content,
                  isStreaming: false,
                  costUSD,
                }
              : msg
          )
        );
      } else if (activeModality === 'image') {
        const result = await generateImage(apiKey, targetModel, promptText, imageAspectRatio);
        const costUSD = await recordCostAndSync(targetModel, 'image', result.usage, promptText);

        const newImage: ImageGenerationResult = {
          id: `img_${Date.now()}`,
          url: result.url,
          prompt: promptText,
          aspectRatio: imageAspectRatio,
          timestamp: Date.now(),
          costUSD,
        };

        setGeneratedImages((prev) => [newImage, ...prev]);
      } else if (activeModality === 'video') {
        const result = await requestVideoGeneration(
          apiKey,
          targetModel,
          promptText,
          videoDuration,
          videoAspectRatio
        );

        const newVideoJob: VideoJob = {
          id: result.jobId,
          prompt: promptText,
          status: 'queued',
          progress: 10,
          timestamp: Date.now(),
          durationSeconds: videoDuration,
          aspectRatio: videoAspectRatio,
        };

        setVideoJobs((prev) => [newVideoJob, ...prev]);
      }
    } catch (e: any) {
      console.error('Generation Error:', e);
      if (activeModality === 'text') {
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Request Error:** ${e?.message || 'Failed to complete request.'}`,
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModalityChange = useCallback((mode: Modality) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveModality(mode);
    setSearchQuery('');
  }, []);

  const handleOpenModelSelector = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsModelSelectorVisible(true);
  }, []);

  const handleSelectModel = useCallback((model: OpenRouterModel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedModel(model);
  }, []);

  // Animated keyboard offset style
  const keyboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardOffset.value }],
  }));

  return (
    <SafeAreaView style={styles.appCanvasContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Onboarding Key Card Modal */}
      <OnboardingModal
        visible={isOnboardingVisible}
        onSuccess={handleOnboardingSuccess}
      />

      {/* Model Catalog Selection Modal */}
      <ModelSelectorModal
        visible={isModelSelectorVisible}
        onClose={() => setIsModelSelectorVisible(false)}
        models={filteredModels}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        activeModality={activeModality}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Top Bar Header with Liquid Glass material styling */}
        <LiquidGlassWrapper effect="regular" style={styles.topHeaderBar}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.brandTitle}>AERO</Text>
            <Text style={styles.brandSubtitle}>OpenRouter Sovereign</Text>
          </View>
        </LiquidGlassWrapper>

        {/* Account Telemetry & Financial Cost Dashboard */}
        <TelemetryBanner
          keyDetails={keyDetails}
          costLedger={costLedger}
          onRefresh={() => refreshTelemetry()}
          isRefreshing={isRefreshingTelemetry}
        />

        {/* Dynamic Modality Segment Control & Sticky Search Matrix */}
        <SegmentControl
          activeModality={activeModality}
          onSelectModality={handleModalityChange}
          selectedModel={selectedModel}
          onOpenModelSelector={handleOpenModelSelector}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        {/* Specialized Modality Workspaces */}
        <View style={styles.workspaceBody}>
          {activeModality === 'text' && (
            <TextWorkspace messages={chatMessages} isGenerating={isGenerating} />
          )}
          {activeModality === 'image' && (
            <ImageWorkspace
              images={generatedImages}
              aspectRatio={imageAspectRatio}
              onSelectAspectRatio={setImageAspectRatio}
              isGenerating={isGenerating}
            />
          )}
          {activeModality === 'video' && (
            <VideoWorkspace
              videoJobs={videoJobs}
              durationSeconds={videoDuration}
              onSelectDuration={setVideoDuration}
              aspectRatio={videoAspectRatio}
              onSelectAspectRatio={setVideoAspectRatio}
              isSubmitting={isGenerating}
            />
          )}
        </View>

        {/* Floating Pill Input Bar */}
        <PillInput
          activeModality={activeModality}
          onSend={handleSendPrompt}
          isGenerating={isGenerating}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appCanvasContainer: {
    flex: 1,
    backgroundColor: '#000000', // True OLED Dark Canvas
  },
  flexContainer: {
    flex: 1,
  },
  topHeaderBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0d0d0d',
    borderBottomWidth: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  workspaceBody: {
    flex: 1,
    marginTop: 8,
  },
});