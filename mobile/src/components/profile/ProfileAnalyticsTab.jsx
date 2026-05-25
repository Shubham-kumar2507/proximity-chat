/**
 * ProfileAnalyticsTab — Stats tab for own profile.
 *
 * Displays last-7-day analytics with sparkline charts:
 *   👀 Profile views, 💬 Chat requests, ✅ Accepted requests,
 *   🎮 Two Truths guesses, 🔥 Hot Take reactions, 🎵 Anthem taps
 *
 * Includes a computed insight message based on view trends.
 * Only visible on the authenticated user's own profile.
 *
 * @module ProfileAnalyticsTab
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import PropTypes from 'prop-types';

import SparklineChart from './SparklineChart';
import {
  getColors,
  spacing,
  typography,
  radius,
  widgetShadow,
  profileTokens,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';
import profileApi from '../../services/profileApi';

/**
 * Single stat row component.
 *
 * @param {Object} props
 * @param {string} props.icon - Emoji icon
 * @param {string} props.label - Stat label
 * @param {number} props.value - Total value for the period
 * @param {number[]} props.sparklineData - 7-day data points
 * @param {string} [props.color] - Sparkline color override
 * @param {number} props.index - Row index for stagger animation
 * @returns {React.ReactElement}
 */
function StatRow({ icon, label, value, sparklineData, color, index }) {
  const colors = getColors();

  return (
    <Animated.View
      entering={FadeInUp.delay(100 + index * 80).duration(300).springify()}
    >
      <View
        style={[
          styles.statRow,
          { backgroundColor: colors.surfaceElevated },
          widgetShadow,
        ]}
      >
        <View style={styles.statLeft}>
          <Text style={styles.statIcon}>{icon}</Text>
          <View style={styles.statInfo}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {label}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {value.toLocaleString()}
            </Text>
          </View>
        </View>
        <SparklineChart
          data={sparklineData}
          color={color || colors.primary}
          width={80}
          height={28}
          animDelay={200 + index * 80}
        />
      </View>
    </Animated.View>
  );
}

StatRow.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  sparklineData: PropTypes.arrayOf(PropTypes.number).isRequired,
  color: PropTypes.string,
  index: PropTypes.number.isRequired,
};

/**
 * Hot Take reaction bar (agree vs disagree split).
 *
 * @param {Object} props
 * @param {number} props.agree - Agree count
 * @param {number} props.disagree - Disagree count
 * @returns {React.ReactElement}
 */
function ReactionBar({ agree, disagree }) {
  const colors = getColors();
  const total = agree + disagree;
  const agreePct = total > 0 ? (agree / total) * 100 : 50;

  return (
    <View style={styles.reactionBarContainer}>
      <View style={styles.reactionBarLabels}>
        <Text style={[styles.reactionLabel, { color: colors.success }]}>
          👏 {agree}
        </Text>
        <Text style={[styles.reactionLabel, { color: colors.danger }]}>
          🙄 {disagree}
        </Text>
      </View>
      <View style={[styles.reactionBar, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.reactionFill,
            {
              width: `${agreePct}%`,
              backgroundColor: colors.success,
            },
          ]}
        />
      </View>
    </View>
  );
}

ReactionBar.propTypes = {
  agree: PropTypes.number.isRequired,
  disagree: PropTypes.number.isRequired,
};

/**
 * Compute an insight message based on view trends.
 *
 * @param {number} currentViews - Views in current period
 * @param {number} priorViews - Views in prior period
 * @returns {string}
 */
function computeInsight(currentViews, priorViews) {
  if (priorViews === 0 && currentViews === 0) {
    return STRINGS.ANALYTICS_INSIGHT_QUIET;
  }
  if (priorViews === 0) {
    return STRINGS.ANALYTICS_INSIGHT_GREAT;
  }
  const ratio = currentViews / priorViews;
  if (ratio >= 1.2) {
    return STRINGS.ANALYTICS_INSIGHT_GREAT;
  }
  if (ratio >= 0.8) {
    return STRINGS.ANALYTICS_INSIGHT_STEADY;
  }
  return STRINGS.ANALYTICS_INSIGHT_QUIET;
}

/**
 * Profile analytics tab component.
 *
 * @returns {React.ReactElement}
 */
export default function ProfileAnalyticsTab() {
  const colors = getColors();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await profileApi.fetchAnalytics('7d');
      setAnalytics(data);
    } catch (e) {
      console.warn('Failed to fetch analytics:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Fallback data structure if API returns incomplete
  const data = analytics || {
    profileViews: { total: 0, daily: [0, 0, 0, 0, 0, 0, 0] },
    chatRequests: { total: 0, daily: [0, 0, 0, 0, 0, 0, 0] },
    chatAccepted: { total: 0, daily: [0, 0, 0, 0, 0, 0, 0] },
    twoTruthsGuesses: { total: 0, daily: [0, 0, 0, 0, 0, 0, 0] },
    hotTakeReactions: { total: 0, agree: 0, disagree: 0, daily: [0, 0, 0, 0, 0, 0, 0] },
    anthemTaps: { total: 0, daily: [0, 0, 0, 0, 0, 0, 0] },
    priorPeriodViews: 0,
  };

  const insight = computeInsight(data.profileViews.total, data.priorPeriodViews || 0);

  const stats = [
    {
      icon: '👀',
      label: STRINGS.ANALYTICS_VIEWS,
      value: data.profileViews.total,
      sparklineData: data.profileViews.daily,
      color: colors.primary,
    },
    {
      icon: '💬',
      label: STRINGS.ANALYTICS_CHAT_REQUESTS,
      value: data.chatRequests.total,
      sparklineData: data.chatRequests.daily,
      color: colors.info,
    },
    {
      icon: '✅',
      label: STRINGS.ANALYTICS_ACCEPTED,
      value: data.chatAccepted.total,
      sparklineData: data.chatAccepted.daily,
      color: colors.success,
    },
    {
      icon: '🎮',
      label: STRINGS.ANALYTICS_GUESSES,
      value: data.twoTruthsGuesses.total,
      sparklineData: data.twoTruthsGuesses.daily,
      color: colors.accent,
    },
    {
      icon: '🎵',
      label: STRINGS.ANALYTICS_ANTHEM_TAPS,
      value: data.anthemTaps.total,
      sparklineData: data.anthemTaps.daily,
      color: '#1DB954',
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Insight Banner */}
      <Animated.View entering={FadeInUp.delay(0).duration(300).springify()}>
        <LinearGradient
          colors={[colors.primarySurface, 'transparent']}
          style={[styles.insightBanner, { borderColor: colors.border }]}
        >
          <Text style={[styles.insightText, { color: colors.text }]}>
            {insight}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Stat Rows */}
      {stats.map((stat, index) => (
        <StatRow
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          sparklineData={stat.sparklineData}
          color={stat.color}
          index={index}
        />
      ))}

      {/* Hot Take Reaction Split */}
      <Animated.View
        entering={FadeInUp.delay(100 + stats.length * 80).duration(300).springify()}
      >
        <View
          style={[
            styles.statRow,
            { backgroundColor: colors.surfaceElevated },
            widgetShadow,
          ]}
        >
          <View style={styles.statLeft}>
            <Text style={styles.statIcon}>🔥</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {STRINGS.ANALYTICS_HOT_TAKE}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {data.hotTakeReactions.total}
              </Text>
            </View>
          </View>
          <ReactionBar
            agree={data.hotTakeReactions.agree || 0}
            disagree={data.hotTakeReactions.disagree || 0}
          />
        </View>
      </Animated.View>

      {/* Period Label */}
      <Text style={[styles.periodLabel, { color: colors.textMuted }]}>
        {STRINGS.ANALYTICS_PERIOD}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  insightBanner: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  insightText: {
    ...typography.body,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  statIcon: {
    fontSize: 22,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  statValue: {
    ...typography.subtitle,
  },
  // ── Reaction Bar ─────────────────────────
  reactionBarContainer: {
    width: 100,
    gap: spacing.xs,
  },
  reactionBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reactionLabel: {
    ...typography.captionSmall,
  },
  reactionBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  reactionFill: {
    height: '100%',
    borderRadius: 3,
  },
  periodLabel: {
    ...typography.captionSmall,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
