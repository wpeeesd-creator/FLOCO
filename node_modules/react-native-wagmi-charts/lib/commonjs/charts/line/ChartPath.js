"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartPathWrapper = LineChartPathWrapper;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativeSvg = require("react-native-svg");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _reactKeyedFlattenChildren = _interopRequireDefault(require("react-keyed-flatten-children"));
var _Chart = require("./Chart");
var _LineChartPathContext = require("./LineChartPathContext");
var _Path = require("./Path");
var _useLineChart = require("./useLineChart");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BACKGROUND_COMPONENTS = ['LineChartHighlight', 'LineChartHorizontalLine', 'LineChartGradient', 'LineChartDot', 'LineChartTooltip'];
const FOREGROUND_COMPONENTS = ['LineChartHighlight', 'LineChartDot'];
const AnimatedSVG = _reactNativeReanimated.default.createAnimatedComponent(_reactNativeSvg.Svg);
const AnimatedRect = _reactNativeReanimated.default.createAnimatedComponent(_reactNativeSvg.Rect);
LineChartPathWrapper.displayName = 'LineChartPathWrapper';
function LineChartPathWrapper({
  animationDuration = 300,
  animationProps = {},
  children,
  color = 'black',
  inactiveColor,
  width: strokeWidth = 3,
  widthOffset = 20,
  pathProps = {},
  showInactivePath = true,
  animateOnMount,
  mountAnimationDuration = animationDuration,
  mountAnimationProps = animationProps
}) {
  const {
    height,
    pathWidth,
    width
  } = _react.default.useContext(_Chart.LineChartDimensionsContext);
  const {
    currentX,
    isActive
  } = (0, _useLineChart.useLineChart)();
  const isMounted = (0, _reactNativeReanimated.useSharedValue)(false);
  const hasMountedAnimation = (0, _reactNativeReanimated.useSharedValue)(false);
  _react.default.useEffect(() => {
    isMounted.value = true;
    return () => {
      isMounted.value = false;
    };
  }, []);

  ////////////////////////////////////////////////

  const clipId = _react.default.useMemo(() => `clip-foreground-${Math.random().toString(36).substring(2, 11)}`, []);
  const clipProps = (0, _reactNativeReanimated.useAnimatedProps)(() => {
    const shouldAnimateOnMount = animateOnMount === 'foreground';
    const inactiveWidth = !isMounted.value && shouldAnimateOnMount ? 0 : pathWidth;
    let duration = shouldAnimateOnMount && !hasMountedAnimation.value ? mountAnimationDuration : animationDuration;
    const props = shouldAnimateOnMount && !hasMountedAnimation.value ? mountAnimationProps : animationProps;
    if (isActive.value) {
      duration = 0;
    }
    return {
      width: (0, _reactNativeReanimated.withTiming)(isActive.value ?
      // on Web, <svg /> elements don't support negative widths
      // https://github.com/coinjar/react-native-wagmi-charts/issues/24#issuecomment-955789904
      Math.max(currentX.value, 0) : inactiveWidth + widthOffset, Object.assign({
        duration
      }, props), () => {
        hasMountedAnimation.value = true;
      })
    };
  }, [animateOnMount, animationDuration, animationProps, currentX, hasMountedAnimation, isActive, isMounted, mountAnimationDuration, mountAnimationProps, pathWidth, widthOffset]);
  const viewSize = _react.default.useMemo(() => ({
    width,
    height
  }), [width, height]);

  ////////////////////////////////////////////////

  let backgroundChildren;
  let foregroundChildren;
  if (children) {
    const iterableChildren = (0, _reactKeyedFlattenChildren.default)(children);
    backgroundChildren = iterableChildren.filter(child => BACKGROUND_COMPONENTS.includes(child?.type?.displayName || ''));
    foregroundChildren = iterableChildren.filter(child => FOREGROUND_COMPONENTS.includes(child?.type?.displayName || ''));
  }

  ////////////////////////////////////////////////

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_LineChartPathContext.LineChartPathContext.Provider, {
    value: {
      color,
      isInactive: showInactivePath,
      isTransitionEnabled: pathProps.isTransitionEnabled ?? true
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: viewSize
  }, /*#__PURE__*/_react.default.createElement(_reactNativeSvg.Svg, {
    width: width,
    height: height
  }, /*#__PURE__*/_react.default.createElement(_Path.LineChartPath, _extends({
    color: color,
    inactiveColor: inactiveColor,
    width: strokeWidth
  }, pathProps))), /*#__PURE__*/_react.default.createElement(_reactNativeSvg.Svg, {
    style: _reactNative.StyleSheet.absoluteFill
  }, backgroundChildren))), /*#__PURE__*/_react.default.createElement(_LineChartPathContext.LineChartPathContext.Provider, {
    value: {
      color,
      isInactive: false,
      isTransitionEnabled: pathProps.isTransitionEnabled ?? true
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: _reactNative.StyleSheet.absoluteFill
  }, _reactNative.Platform.OS === 'web' ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNativeSvg.Svg, {
    width: width,
    height: height
  }, /*#__PURE__*/_react.default.createElement(_reactNativeSvg.Defs, null, /*#__PURE__*/_react.default.createElement(_reactNativeSvg.ClipPath, {
    id: clipId
  }, /*#__PURE__*/_react.default.createElement(AnimatedRect, {
    x: 0,
    y: 0,
    animatedProps: clipProps,
    height: height
  }))), /*#__PURE__*/_react.default.createElement(_reactNativeSvg.G, {
    clipPath: `url(#${clipId})`
  }, /*#__PURE__*/_react.default.createElement(_Path.LineChartPath, _extends({
    color: color,
    width: strokeWidth
  }, pathProps)))), /*#__PURE__*/_react.default.createElement(_reactNativeSvg.Svg, {
    width: width,
    height: height,
    style: _reactNative.StyleSheet.absoluteFill
  }, /*#__PURE__*/_react.default.createElement(_reactNativeSvg.G, {
    clipPath: `url(#${clipId})`
  }, foregroundChildren))) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(AnimatedSVG, {
    animatedProps: clipProps,
    height: height
  }, /*#__PURE__*/_react.default.createElement(_Path.LineChartPath, _extends({
    color: color,
    width: strokeWidth
  }, pathProps))), /*#__PURE__*/_react.default.createElement(AnimatedSVG, {
    animatedProps: clipProps,
    height: height,
    style: _reactNative.StyleSheet.absoluteFill
  }, foregroundChildren)))));
}
//# sourceMappingURL=ChartPath.js.map