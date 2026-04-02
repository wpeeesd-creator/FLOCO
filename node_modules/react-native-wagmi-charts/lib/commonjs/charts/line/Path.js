"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartPath = LineChartPath;
var React = _interopRequireWildcard(require("react"));
var _reactNativeReanimated = _interopRequireDefault(require("react-native-reanimated"));
var _reactNativeSvg = require("react-native-svg");
var _Chart = require("./Chart");
var _LineChartPathContext = require("./LineChartPathContext");
var _useAnimatedPath = require("./useAnimatedPath");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const AnimatedPath = _reactNativeReanimated.default.createAnimatedComponent(_reactNativeSvg.Path);
LineChartPath.displayName = 'LineChartPath';
function LineChartPath({
  color = 'black',
  inactiveColor,
  width: strokeWidth = 3,
  ...props
}) {
  const {
    path
  } = React.useContext(_Chart.LineChartDimensionsContext);
  const {
    isTransitionEnabled,
    isInactive
  } = React.useContext(_LineChartPathContext.LineChartPathContext);
  const {
    animatedProps
  } = (0, _useAnimatedPath.useAnimatedPath)({
    enabled: isTransitionEnabled,
    path
  });
  return /*#__PURE__*/React.createElement(AnimatedPath, _extends({
    animatedProps: animatedProps,
    fill: "transparent",
    stroke: isInactive ? inactiveColor || color : color,
    strokeOpacity: isInactive && !inactiveColor ? 0.2 : 1,
    strokeWidth: strokeWidth
  }, props));
}
//# sourceMappingURL=Path.js.map