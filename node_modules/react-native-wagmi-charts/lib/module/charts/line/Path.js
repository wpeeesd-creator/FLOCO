function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import * as React from 'react';
import Animated from 'react-native-reanimated';
import { Path } from 'react-native-svg';
import { LineChartDimensionsContext } from './Chart';
import { LineChartPathContext } from './LineChartPathContext';
import { useAnimatedPath } from './useAnimatedPath';
const AnimatedPath = Animated.createAnimatedComponent(Path);
LineChartPath.displayName = 'LineChartPath';
export function LineChartPath({
  color = 'black',
  inactiveColor,
  width: strokeWidth = 3,
  ...props
}) {
  const {
    path
  } = React.useContext(LineChartDimensionsContext);
  const {
    isTransitionEnabled,
    isInactive
  } = React.useContext(LineChartPathContext);
  const {
    animatedProps
  } = useAnimatedPath({
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