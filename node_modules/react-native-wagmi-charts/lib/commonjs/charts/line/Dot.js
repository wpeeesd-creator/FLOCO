"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartDot = LineChartDot;
var _react = _interopRequireDefault(require("react"));
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _reactNativeSvg = require("react-native-svg");
var _Chart = require("./Chart");
var _LineChartPathContext = require("./LineChartPathContext");
var _getXPositionForCurve = require("./utils/getXPositionForCurve");
var _reactNativeRedash = require("react-native-redash");
var _useLineChart = require("./useLineChart");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const AnimatedCircle = _reactNativeReanimated.default.createAnimatedComponent(_reactNativeSvg.Circle);
LineChartDot.displayName = 'LineChartDot';
function LineChartDot({
  at,
  color: defaultColor = 'black',
  dotProps,
  hasOuterDot: defaultHasOuterDot = false,
  hasPulse = false,
  inactiveColor,
  outerDotProps,
  pulseBehaviour = 'while-inactive',
  pulseDurationMs = 800,
  showInactiveColor = true,
  size = 4,
  outerSize = size * 4
}) {
  const {
    isActive
  } = (0, _useLineChart.useLineChart)();
  const {
    parsedPath
  } = _react.default.useContext(_Chart.LineChartDimensionsContext);

  ////////////////////////////////////////////////////////////

  const {
    isInactive: _isInactive
  } = _react.default.useContext(_LineChartPathContext.LineChartPathContext);
  const isInactive = showInactiveColor && _isInactive;
  const color = isInactive ? inactiveColor || defaultColor : defaultColor;
  const opacity = isInactive && !inactiveColor ? 0.5 : 1;
  const hasOuterDot = defaultHasOuterDot || hasPulse;

  ////////////////////////////////////////////////////////////

  const x = (0, _reactNativeReanimated.useDerivedValue)(() => {
    return (0, _reactNativeReanimated.withTiming)((0, _getXPositionForCurve.getXPositionForCurve)(parsedPath, at));
  }, [at, parsedPath]);
  const y = (0, _reactNativeReanimated.useDerivedValue)(() => (0, _reactNativeReanimated.withTiming)((0, _reactNativeRedash.getYForX)(parsedPath, x.value) || 0), [parsedPath, x]);

  ////////////////////////////////////////////////////////////

  const animatedDotProps = (0, _reactNativeReanimated.useAnimatedProps)(() => ({
    cx: x.value,
    cy: y.value
  }), [x, y]);
  const animatedOuterDotProps = (0, _reactNativeReanimated.useAnimatedProps)(() => {
    const defaultProps = {
      cx: x.value,
      cy: y.value,
      opacity: 0.1,
      r: outerSize
    };
    if (!hasPulse) {
      return defaultProps;
    }
    if (isActive.value && pulseBehaviour === 'while-inactive') {
      return {
        ...defaultProps,
        r: 0
      };
    }
    const easing = _reactNativeReanimated.Easing.out(_reactNativeReanimated.Easing.sin);
    const animatedOpacity = (0, _reactNativeReanimated.withRepeat)((0, _reactNativeReanimated.withSequence)((0, _reactNativeReanimated.withTiming)(0), (0, _reactNativeReanimated.withTiming)(0.8), (0, _reactNativeReanimated.withTiming)(0, {
      duration: pulseDurationMs,
      easing
    })), -1, false);
    const scale = (0, _reactNativeReanimated.withRepeat)((0, _reactNativeReanimated.withSequence)((0, _reactNativeReanimated.withTiming)(0), (0, _reactNativeReanimated.withTiming)(0), (0, _reactNativeReanimated.withTiming)(outerSize, {
      duration: pulseDurationMs,
      easing
    })), -1, false);
    if (pulseBehaviour === 'while-inactive') {
      return {
        ...defaultProps,
        opacity: isActive.value ? (0, _reactNativeReanimated.withTiming)(0) : animatedOpacity,
        r: isActive.value ? (0, _reactNativeReanimated.withTiming)(0) : scale
      };
    }
    return {
      ...defaultProps,
      opacity: animatedOpacity,
      r: scale
    };
  }, [hasPulse, isActive, outerSize, pulseBehaviour, pulseDurationMs, x, y]);

  ////////////////////////////////////////////////////////////

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(AnimatedCircle, _extends({
    animatedProps: animatedDotProps,
    r: size,
    fill: color,
    opacity: opacity
  }, dotProps)), hasOuterDot && /*#__PURE__*/_react.default.createElement(AnimatedCircle, _extends({
    animatedProps: animatedOuterDotProps,
    fill: color
  }, outerDotProps)));
}
//# sourceMappingURL=Dot.js.map