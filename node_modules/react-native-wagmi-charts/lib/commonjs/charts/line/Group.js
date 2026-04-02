"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartGroup = LineChartGroup;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactKeyedFlattenChildren = _interopRequireDefault(require("react-keyed-flatten-children"));
var _Chart = require("./Chart");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function LineChartGroup({
  children,
  ...props
}) {
  const flatChildren = (0, _reactKeyedFlattenChildren.default)(children);
  const flatChildrenCount = _react.Children.count(flatChildren);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, props, _react.Children.map(flatChildren, (child, index) => {
    const isLast = index === flatChildrenCount - 1;
    if (!isLast && /*#__PURE__*/_react.default.isValidElement(child) && child.type === _Chart.LineChart) {
      return /*#__PURE__*/(0, _react.cloneElement)(child, {
        absolute: true
      });
    }
    return child;
  }));
}
//# sourceMappingURL=Group.js.map