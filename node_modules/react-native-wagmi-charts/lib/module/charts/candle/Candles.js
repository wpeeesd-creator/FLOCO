function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { Svg } from 'react-native-svg';
import { CandlestickChartDimensionsContext } from './Chart';
import { CandlestickChartCandle } from './Candle';
import { useCandlestickChart } from './useCandlestickChart';
export function CandlestickChartCandles({
  positiveColor,
  negativeColor,
  rectProps,
  lineProps,
  margin,
  useAnimations = true,
  renderRect,
  renderLine,
  candleProps,
  ...props
}) {
  const {
    width,
    height
  } = React.useContext(CandlestickChartDimensionsContext);
  const {
    data,
    domain,
    step
  } = useCandlestickChart();
  return /*#__PURE__*/React.createElement(Svg, _extends({
    width: width,
    height: height
  }, props), step > 0 && data.map((candle, index) => /*#__PURE__*/React.createElement(CandlestickChartCandle, _extends({
    key: index,
    domain: domain,
    margin: margin,
    maxHeight: height,
    width: step,
    positiveColor: positiveColor,
    negativeColor: negativeColor,
    renderRect: renderRect,
    renderLine: renderLine,
    rectProps: rectProps,
    lineProps: lineProps,
    useAnimations: useAnimations,
    candle: candle,
    index: index
  }, candleProps))));
}
//# sourceMappingURL=Candles.js.map