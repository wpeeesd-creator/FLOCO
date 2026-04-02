"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartGradient = LineChartGradient;
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
let id = 0;
LineChartGradient.displayName = 'LineChartGradient';
function LineChartGradient({
  color: overrideColor = undefined,
  children,
  ...props
}) {
  const {
    area
  } = React.useContext(_Chart.LineChartDimensionsContext);
  const {
    color: contextColor,
    isTransitionEnabled
  } = React.useContext(_LineChartPathContext.LineChartPathContext);
  const color = overrideColor || contextColor;

  ////////////////////////////////////////////////

  const {
    animatedProps
  } = (0, _useAnimatedPath.useAnimatedPath)({
    enabled: isTransitionEnabled,
    path: area
  });

  ////////////////////////////////////////////////

  const localId = React.useRef(++id);

  ////////////////////////////////////////////////

  return /*#__PURE__*/React.createElement(React.Fragment, null, children ? /*#__PURE__*/React.createElement(_reactNativeSvg.Defs, null, /*#__PURE__*/React.createElement(_reactNativeSvg.LinearGradient, {
    id: `${localId.current}`,
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "100%"
  }, children)) : /*#__PURE__*/React.createElement(_reactNativeSvg.Defs, null, /*#__PURE__*/React.createElement(_reactNativeSvg.LinearGradient, {
    id: `${localId.current}`,
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "100%"
  }, /*#__PURE__*/React.createElement(_reactNativeSvg.Stop, {
    offset: "20%",
    stopColor: color,
    stopOpacity: 0.15
  }), /*#__PURE__*/React.createElement(_reactNativeSvg.Stop, {
    offset: "40%",
    stopColor: color,
    stopOpacity: 0.05
  }), /*#__PURE__*/React.createElement(_reactNativeSvg.Stop, {
    offset: "100%",
    stopColor: color,
    stopOpacity: 0
  }))), /*#__PURE__*/React.createElement(AnimatedPath, _extends({
    animatedProps: animatedProps,
    fill: `url(#${localId.current})`
  }, props)));
}
//# sourceMappingURL=Gradient.js.map