"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartTooltip = LineChartTooltip;
var _react = _interopRequireWildcard(require("react"));
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _reactNative = require("react-native");
var _PriceText = require("./PriceText");
var _Cursor = require("./Cursor");
var _Chart = require("./Chart");
var _getXPositionForCurve = require("./utils/getXPositionForCurve");
var _reactNativeRedash = require("react-native-redash");
var _useLineChart = require("./useLineChart");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
LineChartTooltip.displayName = 'LineChartTooltip';
function LineChartTooltip({
  children,
  format,
  xGutter = 8,
  yGutter = 8,
  cursorGutter = 48,
  position = 'top',
  withHorizontalFloating = false,
  textProps,
  textStyle,
  at,
  ...props
}) {
  const {
    width,
    height,
    parsedPath
  } = _react.default.useContext(_Chart.LineChartDimensionsContext);
  const {
    type
  } = _react.default.useContext(_Cursor.CursorContext);
  const {
    currentX,
    currentY,
    isActive
  } = (0, _useLineChart.useLineChart)();
  const elementWidth = (0, _reactNativeReanimated.useSharedValue)(0);
  const elementHeight = (0, _reactNativeReanimated.useSharedValue)(0);
  const handleLayout = _react.default.useCallback(event => {
    elementWidth.value = event.nativeEvent.layout.width;
    elementHeight.value = event.nativeEvent.layout.height;
  }, [elementHeight, elementWidth]);

  // When the user set a `at` index, get the index's y & x positions
  const atXPosition = (0, _react.useMemo)(() => at !== null && at !== undefined ? (0, _getXPositionForCurve.getXPositionForCurve)(parsedPath, at) : undefined, [at, parsedPath]);
  const atYPosition = (0, _reactNativeReanimated.useDerivedValue)(() => {
    return atXPosition == null ? undefined : (0, _reactNativeRedash.getYForX)(parsedPath, atXPosition) ?? 0;
  }, [atXPosition]);
  const getInitialTranslateXOffset = _react.default.useCallback(elementWidth => {
    'worklet';

    if (position === 'right') return elementWidth + cursorGutter;
    if (position === 'left') return -cursorGutter;
    return elementWidth / 2;
  }, [cursorGutter, position]);

  /**
   * Helper function to calculate the X translation offset based on position
   * and boundary constraints
   */
  const calculateXTranslateOffset = _react.default.useCallback(params => {
    'worklet';

    const {
      position,
      x,
      elementWidth,
      width,
      xGutter,
      cursorGutter,
      withHorizontalFloating
    } = params;
    let translateXOffset = getInitialTranslateXOffset(elementWidth);
    const elementFullWidth = elementWidth + xGutter + cursorGutter;
    if (position === 'right') {
      if (x < elementFullWidth) {
        translateXOffset = withHorizontalFloating ? -cursorGutter : translateXOffset - elementFullWidth + x;
      }
    } else if (position === 'left') {
      if (x > width - elementFullWidth) {
        translateXOffset = withHorizontalFloating ? elementWidth + cursorGutter : translateXOffset + (x - (width - elementFullWidth));
      }
    } else {
      // Center position
      if (x < elementWidth / 2 + xGutter) {
        translateXOffset -= elementWidth / 2 + xGutter - x;
      }
      if (x > width - elementWidth / 2 - xGutter) {
        translateXOffset += x - (width - elementWidth / 2 - xGutter);
      }
    }
    return translateXOffset;
  }, [getInitialTranslateXOffset]);

  /**
   * Helper function to calculate the Y translation offset based on position and
   * boundary constraints
   */
  const calculateYTranslateOffset = _react.default.useCallback(params => {
    'worklet';

    const {
      position,
      y,
      elementHeight,
      height,
      yGutter,
      cursorGutter
    } = params;
    let translateYOffset = 0;
    if (position === 'top') {
      translateYOffset = elementHeight / 2 + cursorGutter;
      if (y - translateYOffset < yGutter) {
        translateYOffset = y - yGutter;
      }
    } else if (position === 'bottom') {
      translateYOffset = -(elementHeight / 2) - cursorGutter / 2;
      if (y - translateYOffset + elementHeight > height - yGutter) {
        translateYOffset = y - (height - yGutter) + elementHeight;
      }
    } else if (position === 'right' || position === 'left') {
      translateYOffset = elementHeight / 2;
    }
    return translateYOffset;
  }, []);
  const animatedCursorStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    // the tooltip is considered static when the user specified an `at` prop
    const isStatic = atYPosition.value != null;

    // Calculate X position:
    const x = atXPosition ?? currentX.value;
    const translateXOffset = calculateXTranslateOffset({
      position,
      x,
      elementWidth: elementWidth.value,
      width,
      xGutter,
      cursorGutter,
      withHorizontalFloating
    });
    const translateX = x - translateXOffset;

    // Calculate Y position:
    const y = atYPosition.value ?? currentY.value;
    const translateYOffset = calculateYTranslateOffset({
      position,
      y,
      elementHeight: elementHeight.value,
      height,
      yGutter,
      cursorGutter
    });

    // Determine final translateY value
    let translateY;
    if (type === 'crosshair' || isStatic) {
      translateY = y - translateYOffset;
    } else {
      translateY = position === 'top' ? yGutter : height - elementHeight.value - yGutter;
    }

    // Calculate opacity
    let opacity = isActive.value ? 1 : 0;
    if (isStatic) {
      // Only show static when there is no active cursor
      opacity = (0, _reactNativeReanimated.withTiming)(isActive.value ? 0 : 1);
    }
    return {
      transform: [{
        translateX
      }, {
        translateY
      }],
      opacity: opacity
    };
  }, [atXPosition, atYPosition, calculateXTranslateOffset, calculateYTranslateOffset, currentX, currentY, cursorGutter, elementHeight, elementWidth, height, isActive, position, type, width, withHorizontalFloating, xGutter, yGutter]);
  return /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, _extends({
    onLayout: handleLayout
  }, props, {
    style: [styles.tooltip, animatedCursorStyle, props.style]
  }), children || /*#__PURE__*/_react.default.createElement(_PriceText.LineChartPriceText, _extends({
    format: format,
    index: at,
    style: [textStyle]
  }, textProps)));
}
const styles = _reactNative.StyleSheet.create({
  tooltip: {
    position: 'absolute',
    padding: 4,
    alignSelf: 'flex-start'
  }
});
//# sourceMappingURL=Tooltip.js.map