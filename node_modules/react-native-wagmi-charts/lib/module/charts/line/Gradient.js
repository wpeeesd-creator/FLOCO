function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import * as React from 'react';
import Animated from 'react-native-reanimated';
import { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { LineChartDimensionsContext } from './Chart';
import { LineChartPathContext } from './LineChartPathContext';
import { useAnimatedPath } from './useAnimatedPath';
const AnimatedPath = Animated.createAnimatedComponent(Path);
let id = 0;
LineChartGradient.displayName = 'LineChartGradient';
export function LineChartGradient({
  color: overrideColor = undefined,
  children,
  ...props
}) {
  const {
    area
  } = React.useContext(LineChartDimensionsContext);
  const {
    color: contextColor,
    isTransitionEnabled
  } = React.useContext(LineChartPathContext);
  const color = overrideColor || contextColor;

  ////////////////////////////////////////////////

  const {
    animatedProps
  } = useAnimatedPath({
    enabled: isTransitionEnabled,
    path: area
  });

  ////////////////////////////////////////////////

  const localId = React.useRef(++id);

  ////////////////////////////////////////////////

  return /*#__PURE__*/React.createElement(React.Fragment, null, children ? /*#__PURE__*/React.createElement(Defs, null, /*#__PURE__*/React.createElement(LinearGradient, {
    id: `${localId.current}`,
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "100%"
  }, children)) : /*#__PURE__*/React.createElement(Defs, null, /*#__PURE__*/React.createElement(LinearGradient, {
    id: `${localId.current}`,
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "100%"
  }, /*#__PURE__*/React.createElement(Stop, {
    offset: "20%",
    stopColor: color,
    stopOpacity: 0.15
  }), /*#__PURE__*/React.createElement(Stop, {
    offset: "40%",
    stopColor: color,
    stopOpacity: 0.05
  }), /*#__PURE__*/React.createElement(Stop, {
    offset: "100%",
    stopColor: color,
    stopOpacity: 0
  }))), /*#__PURE__*/React.createElement(AnimatedPath, _extends({
    animatedProps: animatedProps,
    fill: `url(#${localId.current})`
  }, props)));
}
//# sourceMappingURL=Gradient.js.map