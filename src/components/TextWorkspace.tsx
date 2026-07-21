import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Sparkles, User, DollarSign } from 'lucide-react-native';
import { ChatMessage } from '../types';

interface TextWorkspaceProps {
  messages: ChatMessage[];
  isGenerating: boolean;
}

export const TextWorkspace: React.FC<TextWorkspaceProps> = ({ messages, isGenerating }) => {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isGenerating]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyCanvasContainer}>
          <View style={styles.geminiBadgeIcon}>
            <Sparkles color="#38BDF8" size={32} />
          </View>
          <Text style={styles.emptyTitle}>Aero Gemini Canvas</Text>
          <Text style={styles.emptySubtitle}>
            Ask anything, execute deep reasoning, write code, or explore complex analysis.
          </Text>
        </View>
      ) : (
        messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <View key={msg.id} style={styles.userCardWrapper}>
                <View style={styles.userFloatingPanel}>
                  <Text style={styles.userMessageText}>{msg.content}</Text>
                </View>
              </View>
            );
          } else {
            return (
              <View key={msg.id} style={styles.assistantCanvasWrapper}>
                <View style={styles.assistantHeaderRow}>
                  <Sparkles color="#38BDF8" size={16} />
                  <Text style={styles.assistantLabel}>Aero Engine</Text>
                  {msg.costUSD !== undefined && (
                    <View style={styles.costBadge}>
                      <DollarSign color="#10B981" size={10} />
                      <Text style={styles.costText}>{msg.costUSD.toFixed(5)}</Text>
                    </View>
                  )}
                </View>

                {/* Assistant content renders directly on dark canvas - no bubble background */}
                <View style={styles.markdownContainer}>
                  <Markdown style={markdownStyles}>{msg.content}</Markdown>
                </View>

                {msg.isStreaming && (
                  <View style={styles.streamingIndicator}>
                    <ActivityIndicator size="small" color="#38BDF8" />
                    <Text style={styles.streamingText}>Streaming response...</Text>
                  </View>
                )}
              </View>
            );
          }
        })
      )}

      {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
        <View style={styles.assistantCanvasWrapper}>
          <View style={styles.assistantHeaderRow}>
            <Sparkles color="#38BDF8" size={16} />
            <Text style={styles.assistantLabel}>Aero Engine</Text>
          </View>
          <View style={styles.streamingIndicator}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.streamingText}>Synthesizing reasoning...</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const markdownStyles = {
  body: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: undefined,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 16,
  },
  heading1: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  heading2: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '600' as const,
    marginBottom: 10,
    marginTop: 6,
    letterSpacing: -0.3,
  },
  heading3: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 4,
  },
  code_inline: {
    backgroundColor: '#1a1a1a',
    color: '#38BDF8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: 'Courier',
    fontSize: 13,
  },
  code_block: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    fontFamily: 'Courier',
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 20,
  },
  fence: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    fontFamily: 'Courier',
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 20,
  },
  link: {
    color: '#38BDF8',
    textDecorationLine: 'underline' as const,
  },
  list_item: {
    color: '#E2E8F0',
    marginVertical: 3,
  },
  blockquote: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 8,
    borderRadius: 4,
  },
  hr: {
    backgroundColor: '#1a1a1a',
    height: 1,
    marginVertical: 16,
  },
  table: {
    borderWidth: 0,
    marginVertical: 12,
  },
  thead: {
    backgroundColor: '#1a1a1a',
  },
  th: {
    padding: 10,
    color: '#F8FAFC',
    fontWeight: '600' as const,
    fontSize: 13,
  },
  td: {
    padding: 10,
    color: '#E2E8F0',
    fontSize: 13,
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingVertical: 16,
    gap: 20,
  },
  emptyCanvasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  geminiBadgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  userCardWrapper: {
    alignItems: 'flex-end',
  },
  userFloatingPanel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '82%',
  },
  userMessageText: {
    color: '#F8FAFC',
    fontSize: 15,
    lineHeight: 21,
  },
  assistantCanvasWrapper: {
    paddingVertical: 4,
  },
  assistantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  assistantLabel: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  costText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  markdownContainer: {
    paddingLeft: 0,
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  streamingText: {
    color: '#888888',
    fontSize: 13,
  },
});