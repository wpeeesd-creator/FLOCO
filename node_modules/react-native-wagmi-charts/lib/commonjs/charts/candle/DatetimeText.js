"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CandlestickChartDatetimeText = CandlestickChartDatetimeText;
var _react = _interopRequireDefault(require("react"));
var _useDatetime = require("./useDatetime");
var _AnimatedText = require("../../components/AnimatedText");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function CandlestickChartDatetimeText({
  locale,
  options,
  format,
  variant = 'formatted',
  style
}) {
  const datetime = (0, _useDatetime.useCandlestickChartDatetime)({
    format,
    locale,
    options
  });
  return /*#__PURE__*/_react.default.createElement(_AnimatedText.AnimatedText, {
    text: datetime[variant],
    style: style
  });
}
//# sourceMappingURL=DatetimeText.js.map