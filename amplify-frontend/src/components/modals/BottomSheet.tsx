import React, { useState, useEffect } from 'react';
import { View, Pressable, Modal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { colors, spacing, radius } from '@/constants/theme';

interface BottomSheetProps {
  children: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
  peekHeight?: number;
  fullHeight?: boolean;
}

const WINDOW_HEIGHT = Dimensions.get('window').height;
const HANDLE_HEIGHT = 24;
const DISMISS_THRESHOLD = 0.3; // 30% of height

const AnimatedView = Animated.createAnimatedComponent(View);

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  isVisible,
  onClose,
  peekHeight = 400,
  fullHeight = false,
}) => {
  const sheetHeight = fullHeight ? WINDOW_HEIGHT : peekHeight;
  const translateY = useSharedValue(sheetHeight);
  const backdropOpacity = useSharedValue(0);

  // Close handler
  const handleDismiss = () => {
    backdropOpacity.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(sheetHeight, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow dragging down (positive translation)
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      const dismissDistance = sheetHeight * DISMISS_THRESHOLD;

      if (event.translationY > dismissDistance) {
        // Dismiss
        handleDismiss();
      } else {
        // Snap back
        translateY.value = withTiming(0, { duration: 250 });
      }
    });

  // Backdrop press handler
  const handleBackdropPress = () => {
    handleDismiss();
  };

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      translateY.value = 0;
      backdropOpacity.value = withTiming(0.6, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      handleDismiss();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal transparent animationType="none" visible={isVisible} onRequestClose={onClose}>
      {/* Backdrop */}
      <AnimatedView
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bg,
            zIndex: 1,
          },
          backdropAnimatedStyle,
        ]}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={handleBackdropPress}
        />
      </AnimatedView>

      {/* Bottom Sheet */}
      <GestureDetector gesture={panGesture}>
        <AnimatedView
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: sheetHeight + WINDOW_HEIGHT,
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              zIndex: 2,
              overflow: 'hidden',
            },
            sheetAnimatedStyle,
          ]}
        >
          {/* Drag Handle */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              height: HANDLE_HEIGHT,
              paddingTop: spacing.sm,
              paddingBottom: spacing.xs,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: radius.full,
              }}
            />
          </View>

          {/* Content */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.lg,
            }}
          >
            {children}
          </View>
        </AnimatedView>
      </GestureDetector>
    </Modal>
  );
};
