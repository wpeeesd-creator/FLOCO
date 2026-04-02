"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartHorizontalLine = LineChartHorizontalLine;
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _reactNativeSvg = require("react-native-svg");
var _Chart = require("./Chart");
var _react = _interopRequireDefault(require("react"));
var _getXPositionForCurve = require("./utils/getXPositionForCurve");
var _reactNativeRedash = require("react-native-redash");
var _useLineChart = require("./useLineChart");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const AnimatedLine = _reactNativeReanimated.default.createAnimatedComponent(_reactNativeSvg.Line);
LineChartHorizontalLine.displayName = 'LineChartHorizontalLine';
function LineChartHorizontalLine({
  color = 'gray',
  lineProps = {},
  at = {
    index: 0
  },
  offsetY = 0
}) {
  const {
    width,
    parsedPath,
    height,
    gutter
  } = _react.default.useContext(_Chart.LineChartDimensionsContext);
  const {
    yDomain
  } = (0, _useLineChart.useLineChart)();
  const y = (0, _reactNativeReanimated.useDerivedValue)(() => {
    if (typeof at === 'number' || at.index != null) {
      const index = typeof at === 'number' ? at : at.index;
      const yForX = (0, _reactNativeRedash.getYForX)(parsedPath, (0, _getXPositionForCurve.getXPositionForCurve)(parsedPath, index)) || 0;
      return (0, _reactNativeReanimated.withTiming)(yForX + offsetY);
    }
    /**
     * <gutter>
     * | ---------- | <- yDomain.max  |
     * |            |                 | offsetTop
     * |            | <- value        |
     * |            |
     * |            | <- yDomain.min
     * <gutter>
     */

    const offsetTop = yDomain.max - at.value;
    const percentageOffsetTop = offsetTop / (yDomain.max - yDomain.min);
    const heightBetweenGutters = height - gutter * 2;
    const offsetTopPixels = gutter + percentageOffsetTop * heightBetweenGutters;
    return (0, _reactNativeReanimated.withTiming)(offsetTopPixels + offsetY);
  }, [at, gutter, height, offsetY, parsedPath, yDomain.max, yDomain.min]);
  const lineAnimatedProps = (0, _reactNativeReanimated.useAnimatedProps)(() => ({
    x1: 0,
    x2: width,
    y1: y.value,
    y2: y.value
  }), [width, y]);
  return /*#__PURE__*/_react.default.createElement(AnimatedLine, _extends({
    animatedProps: lineAnimatedProps,
    strokeWidth: 2,
    stroke: color,
    strokeDasharray: "3 3"
  }, lineProps));
}
//# sourceMappingURL=HorizontalLine.js.map