"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CandlestickChartPriceText = CandlestickChartPriceText;
var _react = _interopRequireDefault(require("react"));
var _usePrice = require("./usePrice");
var _AnimatedText = require("../../components/AnimatedText");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function CandlestickChartPriceText({
  format,
  precision = 2,
  variant = 'formatted',
  type = 'crosshair',
  style
}) {
  const price = (0, _usePrice.useCandlestickChartPrice)({
    format,
    precision,
    type
  });
  return /*#__PURE__*/_react.default.createElement(_AnimatedText.AnimatedText, {
    text: price[variant],
    style: style
  });
}
//# sourceMappingURL=PriceText.js.map