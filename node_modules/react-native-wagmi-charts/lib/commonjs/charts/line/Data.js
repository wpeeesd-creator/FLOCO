"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DefaultLineChartId = void 0;
exports.LineChartDataProvider = LineChartDataProvider;
exports.LineChartIdProvider = LineChartIdProvider;
exports.useLineChartData = useLineChartData;
exports.useLineChartId = void 0;
var _react = _interopRequireWildcard(require("react"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const DefaultLineChartId = exports.DefaultLineChartId = '__LineChartData';
const LineChartDataContext = /*#__PURE__*/(0, _react.createContext)({
  [DefaultLineChartId]: []
});
function LineChartDataProvider({
  children,
  data
}) {
  const contextValue = (0, _react.useMemo)(() => {
    if (Array.isArray(data)) {
      return {
        [DefaultLineChartId]: data
      };
    }
    return data;
  }, [data]);
  return /*#__PURE__*/_react.default.createElement(LineChartDataContext.Provider, {
    value: contextValue
  }, children);
}
const LineChartIdContext = /*#__PURE__*/(0, _react.createContext)(undefined);
function LineChartIdProvider({
  id,
  children
}) {
  return /*#__PURE__*/_react.default.createElement(LineChartIdContext.Provider, {
    value: id
  }, children);
}
const useLineChartId = () => (0, _react.useContext)(LineChartIdContext);
exports.useLineChartId = useLineChartId;
function useLineChartData({
  id
}) {
  const dataContext = (0, _react.useContext)(LineChartDataContext);
  validateLineChartId(dataContext, id);
  const data = dataContext[id || DefaultLineChartId];
  return (0, _react.useMemo)(() => ({
    data
  }), [data]);
}
function validateLineChartId(dataContext, id) {
  if (id != null && !dataContext[id]) {
    const otherIds = Object.keys(dataContext).filter(otherId => otherId !== DefaultLineChartId);
    const singular = otherIds.length <= 1;
    const joinedIds = otherIds.join(', ');
    const suggestion = otherIds.length ? `Did you mean to use ${singular ? 'this ID' : 'one of these IDs'}: ${joinedIds}` : `You didn't pass any IDs to your <LineChart.Provider />'s data prop. Did you mean to pass an array instead?`;
    console.warn(`[react-native-wagmi-charts] Invalid usage of "id" prop on LineChart. You passed id="${id}", but this ID does not exist in your <LineChart.Provider />'s "data" prop.

${suggestion}`);
  } else if (id == null && !dataContext[DefaultLineChartId]) {
    const otherIds = Object.keys(dataContext);
    const singular = otherIds.length <= 1;
    const joinedIds = otherIds.join(', ');
    const suggestion = otherIds.length ? `Did you mean to use ${singular ? 'this ID' : 'one of these IDs'}: ${joinedIds}` : `You didn't pass any IDs to your <LineChart.Provider />'s data prop. Did you mean to pass an array instead?`;
    console.error(`[react-native-wagmi-charts] Missing data "id" prop on LineChart. You must pass an id prop to <LineChart /> when using a dictionary for your data.

${suggestion}
    `);
  }
}
//# sourceMappingURL=Data.js.map