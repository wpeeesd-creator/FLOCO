function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LineChartCursor } from './Cursor';
import { useLineChart } from './useLineChart';

/**
 * Delay in milliseconds before enabling spring animations on Android. This
 * prevents crashes that can occur when spring animations are enabled on initial
 * render.
 */
const ANDROID_SPRING_ANIMATION_DELAY_MS = 100;
LineChartCursorCrosshair.displayName = 'LineChartCursorCrosshair';
export function LineChartCursorCrosshair({
  children,
  color = 'black',
  size = 8,
  outerSize = 32,
  crosshairWrapperProps = {},
  crosshairProps = {},
  crosshairOuterProps = {},
  ...props
}) {
  const {
    currentX,
    currentY,
    isActive
  } = useLineChart();

  // It seems that enabling spring animation on initial render on Android causes a crash.
  const [enableSpringAnimation, setEnableSpringAnimation] = React.useState(Platform.OS === 'ios');
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setEnableSpringAnimation(true);
    }, ANDROID_SPRING_ANIMATION_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  const animatedCursorStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: currentX.value - outerSize / 2
    }, {
      translateY: currentY.value - outerSize / 2
    }, {
      scale: enableSpringAnimation ? withSpring(isActive.value ? 1 : 0, {
        damping: 10,
        stiffness: 100,
        mass: 0.3
      }) : 0
    }]
  }), [currentX, currentY, enableSpringAnimation, isActive, outerSize]);
  return /*#__PURE__*/React.createElement(LineChartCursor, _extends({
    type: "crosshair"
  }, props), /*#__PURE__*/React.createElement(Animated.View, _extends({}, crosshairWrapperProps, {
    style: [styles.crosshairWrapper, {
      width: outerSize,
      height: outerSize
    }, animatedCursorStyle, crosshairWrapperProps.style]
  }), /*#__PURE__*/React.createElement(View, _extends({}, crosshairOuterProps, {
    style: [styles.crosshairOuter, {
      backgroundColor: color,
      width: outerSize,
      height: outerSize,
      borderRadius: outerSize
    }, crosshairOuterProps.style]
  })), /*#__PURE__*/React.createElement(View, _extends({}, crosshairProps, {
    style: [{
      backgroundColor: color,
      width: size,
      height: size,
      borderRadius: size
    }, crosshairProps.style]
  }))), children);
}
const styles = StyleSheet.create({
  crosshairWrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  crosshairOuter: {
    opacity: 0.1,
    position: 'absolute'
  }
});
//# sourceMappingURL=CursorCrosshair.js.map