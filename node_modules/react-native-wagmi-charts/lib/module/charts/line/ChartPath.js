function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Svg, Defs, ClipPath, Rect, G } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import flattenChildren from 'react-keyed-flatten-children';
import { LineChartDimensionsContext } from './Chart';
import { LineChartPathContext } from './LineChartPathContext';
import { LineChartPath } from './Path';
import { useLineChart } from './useLineChart';
const BACKGROUND_COMPONENTS = ['LineChartHighlight', 'LineChartHorizontalLine', 'LineChartGradient', 'LineChartDot', 'LineChartTooltip'];
const FOREGROUND_COMPONENTS = ['LineChartHighlight', 'LineChartDot'];
const AnimatedSVG = Animated.createAnimatedComponent(Svg);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
LineChartPathWrapper.displayName = 'LineChartPathWrapper';
export function LineChartPathWrapper({
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
  } = React.useContext(LineChartDimensionsContext);
  const {
    currentX,
    isActive
  } = useLineChart();
  const isMounted = useSharedValue(false);
  const hasMountedAnimation = useSharedValue(false);
  React.useEffect(() => {
    isMounted.value = true;
    return () => {
      isMounted.value = false;
    };
  }, []);

  ////////////////////////////////////////////////

  const clipId = React.useMemo(() => `clip-foreground-${Math.random().toString(36).substring(2, 11)}`, []);
  const clipProps = useAnimatedProps(() => {
    const shouldAnimateOnMount = animateOnMount === 'foreground';
    const inactiveWidth = !isMounted.value && shouldAnimateOnMount ? 0 : pathWidth;
    let duration = shouldAnimateOnMount && !hasMountedAnimation.value ? mountAnimationDuration : animationDuration;
    const props = shouldAnimateOnMount && !hasMountedAnimation.value ? mountAnimationProps : animationProps;
    if (isActive.value) {
      duration = 0;
    }
    return {
      width: withTiming(isActive.value ?
      // on Web, <svg /> elements don't support negative widths
      // https://github.com/coinjar/react-native-wagmi-charts/issues/24#issuecomment-955789904
      Math.max(currentX.value, 0) : inactiveWidth + widthOffset, Object.assign({
        duration
      }, props), () => {
        hasMountedAnimation.value = true;
      })
    };
  }, [animateOnMount, animationDuration, animationProps, currentX, hasMountedAnimation, isActive, isMounted, mountAnimationDuration, mountAnimationProps, pathWidth, widthOffset]);
  const viewSize = React.useMemo(() => ({
    width,
    height
  }), [width, height]);

  ////////////////////////////////////////////////

  let backgroundChildren;
  let foregroundChildren;
  if (children) {
    const iterableChildren = flattenChildren(children);
    backgroundChildren = iterableChildren.filter(child => BACKGROUND_COMPONENTS.includes(child?.type?.displayName || ''));
    foregroundChildren = iterableChildren.filter(child => FOREGROUND_COMPONENTS.includes(child?.type?.displayName || ''));
  }

  ////////////////////////////////////////////////

  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(LineChartPathContext.Provider, {
    value: {
      color,
      isInactive: showInactivePath,
      isTransitionEnabled: pathProps.isTransitionEnabled ?? true
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: viewSize
  }, /*#__PURE__*/React.createElement(Svg, {
    width: width,
    height: height
  }, /*#__PURE__*/React.createElement(LineChartPath, _extends({
    color: color,
    inactiveColor: inactiveColor,
    width: strokeWidth
  }, pathProps))), /*#__PURE__*/React.createElement(Svg, {
    style: StyleSheet.absoluteFill
  }, backgroundChildren))), /*#__PURE__*/React.createElement(LineChartPathContext.Provider, {
    value: {
      color,
      isInactive: false,
      isTransitionEnabled: pathProps.isTransitionEnabled ?? true
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: StyleSheet.absoluteFill
  }, Platform.OS === 'web' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Svg, {
    width: width,
    height: height
  }, /*#__PURE__*/React.createElement(Defs, null, /*#__PURE__*/React.createElement(ClipPath, {
    id: clipId
  }, /*#__PURE__*/React.createElement(AnimatedRect, {
    x: 0,
    y: 0,
    animatedProps: clipProps,
    height: height
  }))), /*#__PURE__*/React.createElement(G, {
    clipPath: `url(#${clipId})`
  }, /*#__PURE__*/React.createElement(LineChartPath, _extends({
    color: color,
    width: strokeWidth
  }, pathProps)))), /*#__PURE__*/React.createElement(Svg, {
    width: width,
    height: height,
    style: StyleSheet.absoluteFill
  }, /*#__PURE__*/React.createElement(G, {
    clipPath: `url(#${clipId})`
  }, foregroundChildren))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(AnimatedSVG, {
    animatedProps: clipProps,
    height: height
  }, /*#__PURE__*/React.createElement(LineChartPath, _extends({
    color: color,
    width: strokeWidth
  }, pathProps))), /*#__PURE__*/React.createElement(AnimatedSVG, {
    animatedProps: clipProps,
    height: height,
    style: StyleSheet.absoluteFill
  }, foregroundChildren)))));
}
//# sourceMappingURL=ChartPath.js.map