"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartCursorCrosshair = LineChartCursorCrosshair;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _Cursor = require("./Cursor");
var _useLineChart = require("./useLineChart");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Delay in milliseconds before enabling spring animations on Android. This
 * prevents crashes that can occur when spring animations are enabled on initial
 * render.
 */
const ANDROID_SPRING_ANIMATION_DELAY_MS = 100;
LineChartCursorCrosshair.displayName = 'LineChartCursorCrosshair';
function LineChartCursorCrosshair({
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
  } = (0, _useLineChart.useLineChart)();

  // It seems that enabling spring animation on initial render on Android causes a crash.
  const [enableSpringAnimation, setEnableSpringAnimation] = _react.default.useState(_reactNative.Platform.OS === 'ios');
  _react.default.useEffect(() => {
    const timer = setTimeout(() => {
      setEnableSpringAnimation(true);
    }, ANDROID_SPRING_ANIMATION_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  const animatedCursorStyle = (0, _reactNativeReanimated.useAnimatedStyle)(() => ({
    transform: [{
      translateX: currentX.value - outerSize / 2
    }, {
      translateY: currentY.value - outerSize / 2
    }, {
      scale: enableSpringAnimation ? (0, _reactNativeReanimated.withSpring)(isActive.value ? 1 : 0, {
        damping: 10,
        stiffness: 100,
        mass: 0.3
      }) : 0
    }]
  }), [currentX, currentY, enableSpringAnimation, isActive, outerSize]);
  return /*#__PURE__*/_react.default.createElement(_Cursor.LineChartCursor, _extends({
    type: "crosshair"
  }, props), /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, _extends({}, crosshairWrapperProps, {
    style: [styles.crosshairWrapper, {
      width: outerSize,
      height: outerSize
    }, animatedCursorStyle, crosshairWrapperProps.style]
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, _extends({}, crosshairOuterProps, {
    style: [styles.crosshairOuter, {
      backgroundColor: color,
      width: outerSize,
      height: outerSize,
      borderRadius: outerSize
    }, crosshairOuterProps.style]
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, _extends({}, crosshairProps, {
    style: [{
      backgroundColor: color,
      width: size,
      height: size,
      borderRadius: size
    }, crosshairProps.style]
  }))), children);
}
const styles = _reactNative.StyleSheet.create({
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