"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useLineChart = useLineChart;
var _react = _interopRequireDefault(require("react"));
var _Context = require("./Context");
var _Data = require("./Data");
var _useCurrentY = require("./useCurrentY");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function useLineChart() {
  const lineChartContext = _react.default.useContext(_Context.LineChartContext);
  const maybeId = (0, _Data.useLineChartId)();
  const dataContext = (0, _Data.useLineChartData)({
    id: maybeId
  });
  const currentY = (0, _useCurrentY.useCurrentY)();
  return _react.default.useMemo(() => ({
    ...lineChartContext,
    ...dataContext,
    currentY
  }), [lineChartContext, dataContext, currentY]);
}
//# sourceMappingURL=useLineChart.js.map