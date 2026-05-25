/**
 * Drop-in replacement for @gorhom/bottom-sheet that uses React Native's
 * built-in Modal component instead. This avoids the Reanimated v4
 * incompatibility with @gorhom/bottom-sheet v4/v5.
 */
import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * BottomSheet replacement using Modal
 */
const BottomSheet = forwardRef(
  (
    {
      children,
      index = -1,
      snapPoints = ['50%'],
      onChange,
      onClose,
      enablePanDownToClose = true,
      backgroundStyle,
      handleIndicatorStyle,
      style,
      ...rest
    },
    ref
  ) => {
    const [visible, setVisible] = useState(index >= 0);

    const resolvedHeight = useMemo(() => {
      const point = snapPoints[Math.max(index, 0)] || snapPoints[0] || '50%';
      if (typeof point === 'string' && point.endsWith('%')) {
        return (parseFloat(point) / 100) * SCREEN_HEIGHT;
      }
      return typeof point === 'number' ? point : SCREEN_HEIGHT * 0.5;
    }, [snapPoints, index]);

    const close = useCallback(() => {
      setVisible(false);
      onChange?.(-1);
      onClose?.();
    }, [onChange, onClose]);

    const snapToIndex = useCallback(
      (i) => {
        if (i < 0) {
          close();
        } else {
          setVisible(true);
          onChange?.(i);
        }
      },
      [close, onChange]
    );

    const expand = useCallback(() => snapToIndex(snapPoints.length - 1), [
      snapToIndex,
      snapPoints,
    ]);

    const collapse = useCallback(() => snapToIndex(0), [snapToIndex]);

    useImperativeHandle(ref, () => ({
      close,
      expand,
      collapse,
      snapToIndex,
      snapToPosition: () => {},
      forceClose: close,
    }));

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={enablePanDownToClose ? close : undefined}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[
              styles.sheet,
              { minHeight: resolvedHeight },
              backgroundStyle,
              style,
            ]}
          >
            <View style={styles.handleContainer}>
              <View style={[styles.handle, handleIndicatorStyle]} />
            </View>
            {children}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

/**
 * BottomSheetView — simple pass-through wrapper
 */
function BottomSheetView({ children, style, ...props }) {
  return (
    <View style={[{ flex: 1 }, style]} {...props}>
      {children}
    </View>
  );
}

/**
 * BottomSheetScrollView — simple ScrollView wrapper
 */
function BottomSheetScrollView({ children, style, ...props }) {
  const ScrollView = require('react-native').ScrollView;
  return (
    <ScrollView style={[{ flex: 1 }, style]} {...props}>
      {children}
    </ScrollView>
  );
}

/**
 * BottomSheetFlatList — simple FlatList wrapper
 */
function BottomSheetFlatList(props) {
  const { FlatList } = require('react-native');
  return <FlatList {...props} />;
}

/**
 * BottomSheetTextInput — simple TextInput wrapper
 */
function BottomSheetTextInput(props) {
  const { TextInput } = require('react-native');
  return <TextInput {...props} />;
}

/**
 * BottomSheetBackdrop — no-op for compatibility
 */
function BottomSheetBackdrop() {
  return null;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

export default BottomSheet;
export {
  BottomSheet,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetFlatList,
  BottomSheetTextInput,
  BottomSheetBackdrop,
};
