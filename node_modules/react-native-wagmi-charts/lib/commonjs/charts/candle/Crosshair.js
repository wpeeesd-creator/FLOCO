"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CandlestickChartCrosshair = CandlestickChartCrosshair;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativeGestureHandler = require("react-native-gesture-handler");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _reactNativeRedash = require("react-native-redash");
var _Chart = require("./Chart");
var _Line = require("./Line");
var _useCandlestickChart = require("./useCandlestickChart");
var _CrosshairTooltip = require("./CrosshairTooltip");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Threshold in pixels from the left edge of the chart. When the cursor is
 * within this distance, the tooltip will be positioned on the right side.
 */
const TOOLTIP_POSITION_THRESHOLD = 100;
function CandlestickChartCrosshair({
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
  } = _react.default.useContext(_Chart.CandlestickChartDimensionsContext);
  const {
    currentX,
    currentY,
    currentIndex,
    step
  } = (0, _useCandlestickChart.useCandlestickChart)();
  const tooltipPosition = (0, _reactNativeReanimated.useSharedValue)('left');
  const opacity = (0, _reactNativeReanimated.useSharedValue)(0);
  const updatePosition = (x, y) => {
    'worklet';

    const boundedX = x <= width - 1 ? x : width - 1;
    if (boundedX < TOOLTIP_POSITION_THRESHOLD) {
      tooltipPosition.value = 'right';
    } else {
      tooltipPosition.value = 'left';
    }
    currentY.value = (0, _reactNativeRedash.clamp)(y, 0, height);
    currentX.value = boundedX - boundedX % step + step / 2;
    currentIndex.value = Math.floor(boundedX / step);
  };
  const longPressGesture = _reactNativeGestureHandler.Gesture.LongPress().minDuration(minDurationMs).maxDistance(999999).onStart(event => {
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
  const horizontal = (0, _reactNativeReanimated.useAnimatedStyle)(() => ({
    opacity: opacity.value,
    transform: [{
      translateY: currentY.value
    }]
  }), [opacity, currentY]);
  const vertical = (0, _reactNativeReanimated.useAnimatedStyle)(() => ({
    opacity: opacity.value,
    transform: [{
      translateX: currentX.value
    }]
  }), [opacity, currentX]);
  (0, _reactNativeReanimated.useAnimatedReaction)(() => currentX.value, (data, prevData) => {
    if (data !== -1 && data !== prevData && onCurrentXChange) {
      (0, _reactNativeReanimated.runOnJS)(onCurrentXChange)(data);
    }
  }, [currentX]);
  return /*#__PURE__*/_react.default.createElement(_reactNativeGestureHandler.GestureDetector, {
    gesture: longPressGesture
  }, /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, {
    style: _reactNative.StyleSheet.absoluteFill
  }, /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, _extends({
    style: [_reactNative.StyleSheet.absoluteFill, vertical]
  }, verticalCrosshairProps), /*#__PURE__*/_react.default.createElement(_Line.CandlestickChartLine, _extends({
    color: color,
    x: 0,
    y: height
  }, lineProps))), /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, _extends({
    style: [_reactNative.StyleSheet.absoluteFill, horizontal]
  }, horizontalCrosshairProps), /*#__PURE__*/_react.default.createElement(_Line.CandlestickChartLine, _extends({
    color: color,
    x: width,
    y: 0
  }, lineProps)), /*#__PURE__*/_react.default.createElement(_CrosshairTooltip.CandlestickChartCrosshairTooltipContext.Provider, {
    value: {
      position: tooltipPosition
    }
  }, children))));
}
//# sourceMappingURL=Crosshair.js.map