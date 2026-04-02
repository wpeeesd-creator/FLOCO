"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CandlestickChartCandles = CandlestickChartCandles;
var _react = _interopRequireDefault(require("react"));
var _reactNativeSvg = require("react-native-svg");
var _Chart = require("./Chart");
var _Candle = require("./Candle");
var _useCandlestickChart = require("./useCandlestickChart");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function CandlestickChartCandles({
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
  } = _react.default.useContext(_Chart.CandlestickChartDimensionsContext);
  const {
    data,
    domain,
    step
  } = (0, _useCandlestickChart.useCandlestickChart)();
  return /*#__PURE__*/_react.default.createElement(_reactNativeSvg.Svg, _extends({
    width: width,
    height: height
  }, props), step > 0 && data.map((candle, index) => /*#__PURE__*/_react.default.createElement(_Candle.CandlestickChartCandle, _extends({
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