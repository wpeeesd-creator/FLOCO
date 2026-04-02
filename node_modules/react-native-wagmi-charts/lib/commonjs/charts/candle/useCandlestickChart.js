"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCandlestickChart = useCandlestickChart;
var _react = _interopRequireDefault(require("react"));
var _Context = require("./Context");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function useCandlestickChart() {
  return _react.default.useContext(_Context.CandlestickChartContext);
}
//# sourceMappingURL=useCandlestickChart.js.map