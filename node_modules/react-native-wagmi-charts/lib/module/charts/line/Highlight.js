function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import * as React from 'react';
import Animated from 'react-native-reanimated';
import { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { LineChartDimensionsContext } from './Chart';
import { LineChartPathContext } from './LineChartPathContext';
import { useAnimatedPath } from './useAnimatedPath';
import { getXPositionForCurve } from './utils/getXPositionForCurve';
const AnimatedPath = Animated.createAnimatedComponent(Path);
LineChartHighlight.displayName = 'LineChartHighlight';
export function LineChartHighlight({
  color = 'black',
  inactiveColor,
  showInactiveColor = true,
  from,
  to,
  width: strokeWidth = 3,
  ...props
}) {
  const {
    path,
    parsedPath,
    height
  } = React.useContext(LineChartDimensionsContext);
  const {
    isTransitionEnabled,
    isInactive: _isInactive
  } = React.useContext(LineChartPathContext);
  const isInactive = showInactiveColor && _isInactive;

  ////////////////////////////////////////////////

  const {
    animatedProps
  } = useAnimatedPath({
    enabled: isTransitionEnabled,
    path
  });

  ////////////////////////////////////////////////

  const clipId = React.useMemo(() => `clip-${Math.random().toString(36).substring(2, 11)}`, []);
  const clipStart = getXPositionForCurve(parsedPath, from);
  const clipEnd = getXPositionForCurve(parsedPath, to);
  return /*#__PURE__*/React.createElement(G, null, /*#__PURE__*/React.createElement(Defs, null, /*#__PURE__*/React.createElement(ClipPath, {
    id: clipId
  }, /*#__PURE__*/React.createElement(Rect, {
    x: clipStart,
    y: "0",
    width: clipEnd - clipStart,
    height: height,
    fill: "white"
  }))), /*#__PURE__*/React.createElement(AnimatedPath, _extends({
    clipPath: `url(#${clipId})`,
    animatedProps: animatedProps,
    fill: "transparent",
    stroke: isInactive ? inactiveColor || color : color,
    strokeWidth: strokeWidth,
    strokeOpacity: isInactive && !inactiveColor ? 0.5 : 1
  }, props)));
}
//# sourceMappingURL=Highlight.js.map