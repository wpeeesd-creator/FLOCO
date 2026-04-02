function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { clamp } from 'react-native-redash';
import { CandlestickChartDimensionsContext } from './Chart';
import { CandlestickChartLine } from './Line';
import { useCandlestickChart } from './useCandlestickChart';
import { CandlestickChartCrosshairTooltipContext } from './CrosshairTooltip';

/**
 * Threshold in pixels from the left edge of the chart. When the cursor is
 * within this distance, the tooltip will be positioned on the right side.
 */
const TOOLTIP_POSITION_THRESHOLD = 100;
export function CandlestickChartCrosshair({
  color,
  onCurrentXChange,
  children,
  horizontalCrosshairProps = {},
  verticalCrosshairProps = {},
  lineProps = {},
  minDurationMs = 0
}) {
  const {
    width,
    height
  } = React.useContext(CandlestickChartDimensionsContext);
  const {
    currentX,
    currentY,
    currentIndex,
    step
  } = useCandlestickChart();
  const tooltipPosition = useSharedValue('left');
  const opacity = useSharedValue(0);
  const updatePosition = (x, y) => {
    'worklet';

    const boundedX = x <= width - 1 ? x : width - 1;
    if (boundedX < TOOLTIP_POSITION_THRESHOLD) {
      tooltipPosition.value = 'right';
    } else {
      tooltipPosition.value = 'left';
    }
    currentY.value = clamp(y, 0, height);
    currentX.value = boundedX - boundedX % step + step / 2;
    currentIndex.value = Math.floor(boundedX / step);
  };
  const longPressGesture = Gesture.LongPress().minDuration(minDurationMs).maxDistance(999999).onStart(event => {
    'worklet';

    opacity.value = 1;
    updatePosition(event.x, event.y);
  }).onTouchesMove(event => {
    'worklet';

    if (opacity.value === 1 && event.allTouches.length > 0 && event.allTouches[0]) {
      updatePosition(event.allTouches[0].x, event.allTouches[0].y);
    }
  }).onEnd(() => {
    'worklet';

    opacity.value = 0;
    currentY.value = -1;
    currentX.value = -1;
    currentIndex.value = -1;
  });
  const horizontal = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{
      translateY: currentY.value
    }]
  }), [opacity, currentY]);
  const vertical = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{
      translateX: currentX.value
    }]
  }), [opacity, currentX]);
  useAnimatedReaction(() => currentX.value, (data, prevData) => {
    if (data !== -1 && data !== prevData && onCurrentXChange) {
      runOnJS(onCurrentXChange)(data);
    }
  }, [currentX]);
  return /*#__PURE__*/React.createElement(GestureDetector, {
    gesture: longPressGesture
  }, /*#__PURE__*/React.createElement(Animated.View, {
    style: StyleSheet.absoluteFill
  }, /*#__PURE__*/React.createElement(Animated.View, _extends({
    style: [StyleSheet.absoluteFill, vertical]
  }, verticalCrosshairProps), /*#__PURE__*/React.createElement(CandlestickChartLine, _extends({
    color: color,
    x: 0,
    y: height
  }, lineProps))), /*#__PURE__*/React.createElement(Animated.View, _extends({
    style: [StyleSheet.absoluteFill, horizontal]
  }, horizontalCrosshairProps), /*#__PURE__*/React.createElement(CandlestickChartLine, _extends({
    color: color,
    x: width,
    y: 0
  }, lineProps)), /*#__PURE__*/React.createElement(CandlestickChartCrosshairTooltipContext.Provider, {
    value: {
      position: tooltipPosition
    }
  }, children))));
}
//# sourceMappingURL=Crosshair.js.map