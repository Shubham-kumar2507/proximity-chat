/**
 * DraggableWidgetCanvas — Drag-to-reorder widget canvas.
 *
 * Replaces WidgetCanvas for reorder support on own profile.
 * Long-press activates reorder mode with drag handles.
 * Uses Reanimated 3 + Gesture Handler for smooth drag animations.
 * Auto-exits reorder mode after 3s inactivity or tap outside.
 *
 * @module DraggableWidgetCanvas
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { GripVertical } from 'lucide-react-native';
import PropTypes from 'prop-types';
import { getColors, spacing, profileTokens, widgetShadow } from '../../constants/theme';

const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 };
const ITEM_MARGIN = profileTokens.widgetGap;
const INACTIVITY_TIMEOUT = 3000;

/**
 * Single draggable item wrapper.
 */
function DraggableItem({ children, index, itemHeight, isReordering, onDragStart, onDragEnd, onDragUpdate, totalItems, colors }) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const isActive = useSharedValue(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  const gesture = Gesture.Pan()
    .enabled(isReordering)
    .onStart(() => {
      isActive.value = true;
      zIndex.value = 100;
      scale.value = withSpring(0.97, SPRING_CONFIG);
      runOnJS(onDragStart)(index);
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
      const newIndex = Math.round(e.translationY / (itemHeight + ITEM_MARGIN));
      const clampedNew = Math.max(0, Math.min(totalItems - 1, index + newIndex));
      if (clampedNew !== index) {
        runOnJS(onDragUpdate)(index, clampedNew);
      }
    })
    .onEnd(() => {
      isActive.value = false;
      translateY.value = withSpring(0, SPRING_CONFIG);
      scale.value = withSpring(1, SPRING_CONFIG);
      zIndex.value = 0;
      runOnJS(onDragEnd)();
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.itemWrapper, animStyle]}>
        {children}
        {isReordering && (
          <View style={[styles.dragHandle, { backgroundColor: colors.surfaceActive + '80' }]}>
            <GripVertical size={18} color={colors.textMuted} />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * DraggableWidgetCanvas component.
 *
 * @param {Object} props
 * @param {React.ReactNode[]} props.children - Widget components (array)
 * @param {boolean} props.isOwnProfile - Whether this is own profile
 * @param {number[]} props.widgetOrder - Current order indices
 * @param {Function} props.onReorder - Called with new order array
 * @param {Object} [props.widgetVisibility] - Visibility map
 * @returns {React.ReactElement}
 */
export default function DraggableWidgetCanvas({
  children,
  isOwnProfile,
  widgetOrder,
  onReorder,
  widgetVisibility,
}) {
  const colors = getColors();
  const [isReordering, setIsReordering] = useState(false);
  const [localOrder, setLocalOrder] = useState(widgetOrder || []);
  const [itemHeight, setItemHeight] = useState(160);
  const inactivityTimer = useRef(null);
  const itemHeights = useRef({});

  useEffect(() => {
    setLocalOrder(widgetOrder || []);
  }, [widgetOrder]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setIsReordering(false);
      onReorder?.(localOrder);
    }, INACTIVITY_TIMEOUT);
  }, [localOrder, onReorder]);

  const handleLongPress = useCallback(() => {
    if (!isOwnProfile) return;
    setIsReordering(true);
    resetInactivityTimer();
  }, [isOwnProfile, resetInactivityTimer]);

  const handleTapOutside = useCallback(() => {
    if (isReordering) {
      setIsReordering(false);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      onReorder?.(localOrder);
    }
  }, [isReordering, localOrder, onReorder]);

  const handleDragStart = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  const handleDragUpdate = useCallback((fromIndex, toIndex) => {
    setLocalOrder((prev) => {
      const next = [...prev];
      const item = next.splice(fromIndex, 1)[0];
      next.splice(toIndex, 0, item);
      return next;
    });
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const handleDragEnd = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const handleItemLayout = useCallback((index, event) => {
    const h = event.nativeEvent.layout.height;
    itemHeights.current[index] = h;
    const heights = Object.values(itemHeights.current);
    if (heights.length > 0) {
      setItemHeight(heights.reduce((a, b) => a + b, 0) / heights.length);
    }
  }, []);

  // Convert children to array and filter by visibility
  const childArray = React.Children.toArray(children);
  const widgetKeys = ['hotTake', 'twoTruths', 'anthem', 'favoriteSpot'];

  const orderedChildren = (localOrder.length > 0 ? localOrder : [0, 1, 2, 3])
    .filter((i) => {
      if (!widgetVisibility) return i < childArray.length;
      const key = widgetKeys[i];
      return (widgetVisibility[key] !== false) && i < childArray.length;
    })
    .map((i) => ({ child: childArray[i], originalIndex: i }));

  return (
    <Pressable onPress={handleTapOutside} onLongPress={handleLongPress} delayLongPress={600}>
      <View style={styles.canvas}>
        {orderedChildren.map(({ child, originalIndex }, displayIndex) => (
          <View key={originalIndex} onLayout={(e) => handleItemLayout(originalIndex, e)}>
            {isOwnProfile && isReordering ? (
              <DraggableItem
                index={displayIndex}
                itemHeight={itemHeight}
                isReordering={isReordering}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragUpdate={handleDragUpdate}
                totalItems={orderedChildren.length}
                colors={colors}
              >
                {child}
              </DraggableItem>
            ) : (
              child
            )}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

DraggableWidgetCanvas.propTypes = {
  children: PropTypes.node.isRequired,
  isOwnProfile: PropTypes.bool,
  widgetOrder: PropTypes.arrayOf(PropTypes.number),
  onReorder: PropTypes.func,
  widgetVisibility: PropTypes.object,
};

DraggableWidgetCanvas.defaultProps = {
  isOwnProfile: false,
  widgetOrder: [0, 1, 2, 3],
  onReorder: null,
  widgetVisibility: null,
};

const styles = StyleSheet.create({
  canvas: {
    paddingHorizontal: profileTokens.widgetPadding,
    gap: profileTokens.widgetGap,
    paddingBottom: spacing.xxl,
  },
  itemWrapper: {
    position: 'relative',
  },
  dragHandle: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
