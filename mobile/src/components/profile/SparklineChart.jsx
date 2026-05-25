/**
 * SparklineChart — Reusable 7-day mini sparkline chart.
 *
 * Renders a compact SVG line chart for profile analytics.
 * Supports customizable color, dimensions, and data points.
 * Uses react-native-svg for lightweight rendering.
 *
 * @module SparklineChart
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { getColors } from '../../constants/theme';

/**
 * Build an SVG path string from data points.
 *
 * @param {number[]} data - Array of values
 * @param {number} width - Chart width
 * @param {number} height - Chart height
 * @param {number} padding - Vertical padding
 * @returns {{ linePath: string, fillPath: string }}
 */
function buildPaths(data, width, height, padding) {
  if (!data || data.length < 2) {
    const mid = height / 2;
    return {
      linePath: `M 0 ${mid} L ${width} ${mid}`,
      fillPath: `M 0 ${mid} L ${width} ${mid} L ${width} ${height} L 0 ${height} Z`,
    };
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const usableHeight = height - padding * 2;

  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: padding + usableHeight - ((val - min) / range) * usableHeight,
  }));

  // Smooth curve using catmull-rom to bezier
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  const last = points[points.length - 1];
  const first = points[0];
  const fillPath = `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;

  return { linePath, fillPath };
}

/**
 * Sparkline chart component.
 *
 * @param {Object} props
 * @param {number[]} props.data - Array of 7 data points
 * @param {string} [props.color] - Line color
 * @param {number} [props.width] - Chart width
 * @param {number} [props.height] - Chart height
 * @param {number} [props.strokeWidth] - Line stroke width
 * @param {number} [props.animDelay] - Fade-in delay in ms
 * @returns {React.ReactElement}
 */
export default function SparklineChart({
  data,
  color,
  width = 80,
  height = 28,
  strokeWidth = 1.5,
  animDelay = 0,
}) {
  const colors = getColors();
  const lineColor = color || colors.primary;

  const { linePath, fillPath } = useMemo(
    () => buildPaths(data, width, height, 3),
    [data, width, height]
  );

  const gradientId = useMemo(
    () => `sparkline_${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  return (
    <Animated.View entering={FadeIn.delay(animDelay).duration(400)}>
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <SvgGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
            </SvgGradient>
          </Defs>
          {/* Fill area */}
          <Path d={fillPath} fill={`url(#${gradientId})`} />
          {/* Line */}
          <Path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Animated.View>
  );
}

SparklineChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number).isRequired,
  color: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  strokeWidth: PropTypes.number,
  animDelay: PropTypes.number,
};

SparklineChart.defaultProps = {
  color: null,
  width: 80,
  height: 28,
  strokeWidth: 1.5,
  animDelay: 0,
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
