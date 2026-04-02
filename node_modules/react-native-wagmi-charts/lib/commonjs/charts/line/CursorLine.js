"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartCursorLine = LineChartCursorLine;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _reactNativeSvg = _interopRequireWildcard(require("react-native-svg"));
var _AnimatedText = require("../../components/AnimatedText");
var _Chart = require("./Chart");
var _Cursor = require("./Cursor");
var _useDatetime = require("./useDatetime");
var _useLineChart = require("./useLineChart");
var _usePrice = require("./usePrice");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
LineChartCursorLine.displayName = 'LineChartCursorLine';
const TEXT_CONSTANTS = {
  DEFAULT_COLOR: '#1A1E27',
  DEFAULT_FONT_SIZE: 12,
  CHAR_WIDTH_RATIO: 0.6,
  MIN_WIDTH: 25,
  MAX_WIDTH: 150,
  INPUT_PADDING: 4
};
const SPACING = {
  VERTICAL_TEXT_OFFSET: 40,
  HORIZONTAL_TEXT_MARGIN: 8,
  HORIZONTAL_RIGHT_MARGIN: 16,
  BASE_LINE_GAP: 8,
  X_AXIS_LABEL_RESERVED_HEIGHT: 40 // Reserved space at bottom for x-axis labels
};
const AnimatedLine = _reactNativeReanimated.default.createAnimatedComponent(_reactNativeSvg.Line);
function LineChartCursorLine({
  children,
  color = 'gray',
  lineProps,
  format,
  textStyle,
  ...cursorProps
}) {
  const isHorizontal = cursorProps?.orientation === 'horizontal';
  const {
    height,
    width
  } = _react.default.useContext(_Chart.LineChartDimensionsContext);
  const {
    currentX,
    currentY,
    isActive
  } = (0, _useLineChart.useLineChart)();
  const price = (0, _usePrice.useLineChartPrice)({
    format: isHorizontal ? format : undefined,
    precision: 2
  });
  const datetime = (0, _useDatetime.useLineChartDatetime)({
    format: !isHorizontal ? format : undefined
  });
  const displayText = isHorizontal ? price.formatted : datetime.formatted;
  const calculateTextWidth = (text, fontSize) => {
    'worklet';

    const charWidth = fontSize * TEXT_CONSTANTS.CHAR_WIDTH_RATIO;
    const calculatedWidth = text.length * charWidth;
    return Math.max(TEXT_CONSTANTS.MIN_WIDTH, Math.min(TEXT_CONSTANTS.MAX_WIDTH, calculatedWidth));
  };
  const textWidth = (0, _reactNativeReanimated.useDerivedValue)(() => {
    const text = displayText.value;
    if (!text) return TEXT_CONSTANTS.MIN_WIDTH;
    const fontSize = textStyle?.fontSize || TEXT_CONSTANTS.DEFAULT_FONT_SIZE;
    return calculateTextWidth(text, fontSize);
  }, [displayText, textStyle?.fontSize]);
  const lineEndX = (0, _reactNativeReanimated.useDerivedValue)(() => {
    if (!isHorizontal) return 0;
    const fontSize = textStyle?.fontSize || TEXT_CONSTANTS.DEFAULT_FONT_SIZE;
    const gap = Math.max(SPACING.BASE_LINE_GAP, fontSize * 0.5);
    return width - textWidth.value - gap - TEXT_CONSTANTS.INPUT_PADDING - SPACING.HORIZONTAL_RIGHT_MARGIN;
  });
  const lineEndY = (0, _reactNativeReanimated.useDerivedValue)(() => {
    if (isHorizontal) return 0;

    // For vertical cursor, extend line to the chart area (excluding reserved label space)
    return height - SPACING.X_AXIS_LABEL_RESERVED_HEIGHT;
  });
  const containerStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => ({
    opacity: isActive.value ? 1 : 0,
    height: '100%',
    transform: isHorizontal ? [{
      translateY: currentY.value
    }] : [{
      translateX: currentX.value
    }]
  }));
  const calculateFontSizeAdjustment = fontSize => {
    'worklet';

    return Math.max(0.6, Math.min(0.8, 0.7 + (fontSize - 12) * 0.01));
  };
  const textPositionStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    const fontSize = textStyle?.fontSize || TEXT_CONSTANTS.DEFAULT_FONT_SIZE;
    const lineHeight = textStyle?.lineHeight || fontSize * 1.2;
    const baseStyle = {
      position: 'absolute',
      width: textWidth.value,
      fontSize,
      lineHeight,
      color: textStyle?.color || TEXT_CONSTANTS.DEFAULT_COLOR,
      ...textStyle
    };
    if (isHorizontal) {
      const fontSizeAdjustment = calculateFontSizeAdjustment(fontSize);
      const textCenterOffset = -(lineHeight * fontSizeAdjustment);
      return {
        ...baseStyle,
        left: width - textWidth.value - SPACING.HORIZONTAL_RIGHT_MARGIN + TEXT_CONSTANTS.INPUT_PADDING,
        top: textCenterOffset,
        textAlign: 'right',
        paddingLeft: 0,
        paddingRight: 0
      };
    }

    // For vertical cursor (x-axis label)
    const halfTextWidth = textWidth.value / 2;

    // Since the container is already translated by currentX, we need to calculate
    // the label position relative to the container's position
    const containerX = currentX.value;

    // Calculate where the label would be if centered
    let labelLeft = -halfTextWidth;

    // Check if label would overflow on the left
    if (containerX + labelLeft < 0) {
      labelLeft = -containerX;
    }

    // Check if label would overflow on the right
    if (containerX + labelLeft + textWidth.value > width) {
      labelLeft = width - containerX - textWidth.value;
    }

    // Position label in the reserved space at the bottom
    const labelTop = height - SPACING.X_AXIS_LABEL_RESERVED_HEIGHT + SPACING.HORIZONTAL_TEXT_MARGIN;
    return {
      ...baseStyle,
      left: labelLeft,
      top: labelTop,
      textAlign: 'center'
    };
  });
  const lineAnimatedProps = (0, _reactNativeReanimated.useAnimatedProps)(() => ({
    x1: 0,
    y1: 0,
    x2: lineEndX.value,
    y2: lineEndY.value
  }), [lineEndX, lineEndY]);
  return /*#__PURE__*/_react.default.createElement(_Cursor.LineChartCursor, _extends({}, cursorProps, {
    type: "line"
  }), /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, {
    style: containerStyle
  }, /*#__PURE__*/_react.default.createElement(_reactNativeSvg.default, {
    style: styles.svg
  }, /*#__PURE__*/_react.default.createElement(AnimatedLine, _extends({
    animatedProps: lineAnimatedProps,
    strokeWidth: 2,
    stroke: color,
    strokeDasharray: "3 3"
  }, lineProps))), /*#__PURE__*/_react.default.createElement(_AnimatedText.AnimatedText, {
    text: displayText,
    style: textPositionStyle
  })), children);
}
const styles = _reactNative.StyleSheet.create({
  svg: {
    ..._reactNative.StyleSheet.absoluteFillObject,
    height: '100%'
  }
});
//# sourceMappingURL=CursorLine.js.map