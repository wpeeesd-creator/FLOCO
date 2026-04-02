function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Line as SVGLine } from 'react-native-svg';
export const CandlestickChartLine = ({
  color = 'gray',
  x,
  y,
  ...props
}) => {
  return /*#__PURE__*/React.createElement(Svg, {
    style: StyleSheet.absoluteFill
  }, /*#__PURE__*/React.createElement(SVGLine, _extends({
    x1: 0,
    y1: 0,
    x2: x,
    y2: y,
    strokeWidth: 2,
    stroke: color,
    strokeDasharray: "6 6"
  }, props)));
};
//# sourceMappingURL=Line.js.map