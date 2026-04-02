"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartPriceText = LineChartPriceText;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = require("react-native-reanimated");
var _usePrice = require("./usePrice");
var _useLineChart = require("./useLineChart");
var _AnimatedText = require("../../components/AnimatedText");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
LineChartPriceText.displayName = 'LineChartPriceText';
function LineChartPriceText({
  format,
  precision = 2,
  variant = 'formatted',
  style,
  index,
  useOptimizedRendering = false,
  getTextColor
}) {
  const price = (0, _usePrice.useLineChartPrice)({
    format,
    precision,
    index
  });

  // If we have a custom format function and optimized rendering is enabled,
  // use regular React state instead of AnimatedText
  if (format && useOptimizedRendering) {
    const {
      currentIndex,
      data
    } = (0, _useLineChart.useLineChart)();
    const [displayText, setDisplayText] = (0, _react.useState)('');
    const [textColor, setTextColor] = (0, _react.useState)('#000000');
    const updateText = newText => {
      setDisplayText(newText);
      // Update color if getTextColor function is provided
      if (getTextColor) {
        setTextColor(getTextColor(newText));
      }
    };
    const textValue = (0, _reactNativeReanimated.useDerivedValue)(() => {
      if (!data) {
        return '';
      }
      if ((typeof currentIndex.value === 'undefined' || currentIndex.value === -1) && index == null) {
        return '';
      }
      let price = 0;
      price = data[Math.min(index ?? currentIndex.value, data.length - 1)].value;
      const valueString = price.toFixed(precision).toString();

      // Call format function directly in worklet
      return format({
        value: valueString,
        formatted: valueString
      });
    }, [currentIndex, data, precision]);

    // Use useAnimatedReaction to update React state with runOnJS
    (0, _reactNativeReanimated.useAnimatedReaction)(() => textValue.value, (current, previous) => {
      if (current !== previous) {
        (0, _reactNativeReanimated.runOnJS)(updateText)(current);
      }
    }, [textValue]);

    // Merge the text color with the provided style
    const dynamicStyle = [style, {
      color: textColor
    }];
    return /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: dynamicStyle
    }, displayText);
  }

  // For non-custom format, use the original approach
  return /*#__PURE__*/_react.default.createElement(_AnimatedText.AnimatedText, {
    text: price[variant],
    style: style
  });
}
//# sourceMappingURL=PriceText.js.map