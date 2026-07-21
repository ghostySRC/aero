import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Play, Video as VideoIcon, Clock, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { VideoJob } from '../types';

interface VideoWorkspaceProps {
  videoJobs: VideoJob[];
  durationSeconds: number;
  onSelectDuration: (dur: number) => void;
  aspectRatio: string;
  onSelectAspectRatio: (ratio: string) => void;
  isSubmitting: boolean;
}

export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  videoJobs,
  durationSeconds,
  onSelectDuration,
  aspectRatio,
  onSelectAspectRatio,
  isSubmitting,
}) => {
  const durations = [5, 10];
  const aspectRatios = ['16:9', '9:16'];

  return (
    <View style={styles.container}>
      {/* Parameter Triggers: Duration & Aspect Ratio */}
      <View style={styles.paramBarContainer}>
        <View style={styles.paramGroup}>
          <Clock color="#38BDF8" size={14} />
          <Text style={styles.paramLabel}>Duration:</Text>
          {durations.map((dur) => (
            <TouchableOpacity
              key={dur}
              style={[styles.paramChip, durationSeconds === dur && styles.paramChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectDuration(dur); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.paramChipText, durationSeconds === dur && styles.paramChipTextActive]}>
                {dur}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.paramGroup}>
          <Text style={styles.paramLabel}>Ratio:</Text>
          {aspectRatios.map((ratio) => (
            <TouchableOpacity
              key={ratio}
              style={[styles.paramChip, aspectRatio === ratio && styles.paramChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectAspectRatio(ratio); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.paramChipText, aspectRatio === ratio && styles.paramChipTextActive]}>
                {ratio}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Video Jobs Timeline Feed */}
      <ScrollView contentContainerStyle={styles.jobsListContainer} showsVerticalScrollIndicator={false}>
        {isSubmitting && (
          <View style={styles.submittingCard}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.submittingText}>Dispatching motion generation job...</Text>
          </View>
        )}

        {videoJobs.length === 0 && !isSubmitting ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <VideoIcon color="#38BDF8" size={28} />
            </View>
            <Text style={styles.emptyTitle}>Video Production Channel</Text>
            <Text style={styles.emptySubtitle}>
              Generate high-definition motion videos with Kling, Veo, Hailuo, or Seedance engines.
              Jobs poll automatically every 15 seconds.
            </Text>
          </View>
        ) : (
          videoJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={styles.jobPromptWrapper}>
                  <Text style={styles.jobPrompt} numberOfLines={2}>
                    {job.prompt}
                  </Text>
                  <Text style={styles.jobMeta}>
                    ID: {job.id.substring(0, 12)}... • {job.durationSeconds || 5}s • {job.aspectRatio || '16:9'}
                  </Text>
                </View>
                {job.status === 'completed' && <CheckCircle2 color="#10B981" size={20} />}
                {job.status === 'failed' && <AlertCircle color="#EF4444" size={20} />}
                {(job.status === 'queued' || job.status === 'processing') && (
                  <ActivityIndicator size="small" color="#38BDF8" />
                )}
              </View>

              {/* Progress Tracking Bar during polling */}
              {job.status !== 'completed' && job.status !== 'failed' && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressStatusText}>
                      State: {job.status.toUpperCase()} (Polling every 15s)
                    </Text>
                    <Text style={styles.progressPercent}>{job.progress}%</Text>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${Math.max(8, job.progress)}%` }]} />
                  </View>
                </View>
              )}

              {/* Completed Video Player */}
              {job.status === 'completed' && job.videoUrl ? (
                <View style={styles.videoPlayerWrapper}>
                  <ExpoVideo
                    source={{ uri: job.videoUrl }}
                    style={styles.videoPlayer}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                  />
                </View>
              ) : null}

              {job.status === 'failed' && (
                <Text style={styles.errorText}>{job.error || 'Video generation failed or timed out.'}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  paramBarContainer: {
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
  paramGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paramLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '600',
  },
  paramChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#141414',
  },
  paramChipActive: {
    backgroundColor: '#38BDF8',
  },
  paramChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  paramChipTextActive: {
    color: '#000000',
  },
  jobsListContainer: {
    paddingBottom: 24,
    gap: 16,
  },
  submittingCard: {
    backgroundColor: '#0d0d0d',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submittingText: {
    color: '#38BDF8',
    fontSize: 13,
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
  jobCard: {
    backgroundColor: '#0d0d0d',
    borderRadius: 18,
    padding: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobPromptWrapper: {
    flex: 1,
    marginRight: 10,
  },
  jobPrompt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  jobMeta: {
    fontSize: 11,
    color: '#888888',
  },
  progressContainer: {
    marginTop: 4,
    gap: 6,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatusText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    color: '#888888',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#141414',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  videoPlayerWrapper: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: '100%',
    height: 220,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
});