import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Wallet, TrendingUp, ChevronDown, ChevronUp, History, RefreshCw } from 'lucide-react-native';
import { KeyDetails, CostLedgerEntry } from '../types';
import { formatUSD } from '../services/costCalculator';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';

interface TelemetryBannerProps {
  keyDetails: KeyDetails | null;
  costLedger: CostLedgerEntry[];
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const TelemetryBanner: React.FC<TelemetryBannerProps> = ({
  keyDetails,
  costLedger,
  onRefresh,
  isRefreshing = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'ledger'>('stats');
  const chevronRotation = useSharedValue(0);

  const animatedChevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const toggleCollapse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCollapsed(!collapsed);
    chevronRotation.value = withSpring(collapsed ? 0 : 180, { damping: 18, stiffness: 120, mass: 0.8 });
  };

  const creditBalance = keyDetails?.limit_remaining;
  const cumulativeSpend = keyDetails?.usage || 0;

  return (
    <LiquidGlassWrapper effect="regular" style={styles.bannerContainer}>
      <View style={styles.bannerHeader}>
        <TouchableOpacity
          style={styles.headerTitleRow}
          onPress={toggleCollapse}
          activeOpacity={0.7}
        >
          <Wallet color="#38BDF8" size={18} />
          <Text style={styles.bannerTitle}>Financial Telemetry</Text>
          {keyDetails?.is_free_tier && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE TIER</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onRefresh(); }} style={styles.iconButton} disabled={isRefreshing}>
            <RefreshCw color="#94A3B8" size={16} style={isRefreshing ? styles.spin : undefined} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleCollapse} style={styles.iconButton}>
            <Animated.View style={animatedChevron}>
              {collapsed ? <ChevronDown color="#94A3B8" size={18} /> : <ChevronUp color="#94A3B8" size={18} />}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {!collapsed && (
        <View style={styles.bannerContent}>
          {/* Metrics summary cards */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Credit Balance</Text>
              <Text style={styles.metricValuePrimary}>
                {creditBalance !== null && creditBalance !== undefined
                  ? formatUSD(creditBalance)
                  : 'Unlimited'}
              </Text>
              <Text style={styles.metricSubtext}>Available Credit</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.subheadRow}>
                <TrendingUp color="#10B981" size={12} />
                <Text style={styles.metricLabel}>Cumulative Spend</Text>
              </View>
              <Text style={styles.metricValueSecondary}>{formatUSD(cumulativeSpend)}</Text>
              <Text style={styles.metricSubtext}>Key Lifetime Usage</Text>
            </View>
          </View>

          {/* Ledger / History selector */}
          <View style={styles.tabSelectorRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('stats'); }}
            >
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'ledger' && styles.tabButtonActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('ledger'); }}
            >
              <History color={activeTab === 'ledger' ? '#38BDF8' : '#64748B'} size={14} style={{ marginRight: 4 }} />
              <Text style={[styles.tabText, activeTab === 'ledger' && styles.tabTextActive]}>
                Session Ledger ({costLedger.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'ledger' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.ledgerScrollView}
              contentContainerStyle={styles.ledgerContainer}
            >
              {costLedger.length === 0 ? (
                <Text style={styles.emptyLedgerText}>No request cycles logged yet in this session.</Text>
              ) : (
                costLedger.map((item) => (
                  <View key={item.id} style={styles.ledgerCard}>
                    <View style={styles.ledgerHeaderRow}>
                      <Text style={styles.ledgerModel}>{item.modelId.split('/')[1] || item.modelId}</Text>
                      <Text style={styles.ledgerCost}>+${item.costUSD.toFixed(5)}</Text>
                    </View>
                    <Text style={styles.ledgerSnippet} numberOfLines={1}>
                      {item.promptSnippet || 'Inference request'}
                    </Text>
                    <Text style={styles.ledgerTokens}>
                      In: {item.promptTokens} | Out: {item.completionTokens}
                      {item.reasoningTokens ? ` (Reasoning: ${item.reasoningTokens})` : ''}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      )}
    </LiquidGlassWrapper>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: '#0d0d0d',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  freeBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeBadgeText: {
    color: '#EAB308',
    fontSize: 10,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },
  spin: {
    // handled visually via state
  },
  bannerContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 12,
  },
  subheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValuePrimary: {
    fontSize: 20,
    fontWeight: '700',
    color: '#38BDF8',
  },
  metricValueSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  metricSubtext: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  tabSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  tabText: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  ledgerScrollView: {
    marginTop: 4,
  },
  ledgerContainer: {
    gap: 10,
    paddingRight: 10,
  },
  emptyLedgerText: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  ledgerCard: {
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 10,
    minWidth: 190,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ledgerModel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  ledgerCost: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  ledgerSnippet: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 4,
  },
  ledgerTokens: {
    fontSize: 10,
    color: '#888888',
  },
});