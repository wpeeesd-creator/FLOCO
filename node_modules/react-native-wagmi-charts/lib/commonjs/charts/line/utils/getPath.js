"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPath = getPath;
var shape = _interopRequireWildcard(require("d3-shape"));
var _d3Scale = require("d3-scale");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function getPath({
  data,
  from,
  to,
  width,
  height,
  gutter,
  shape: _shape,
  yDomain,
  xDomain
}) {
  const timestamps = data.map(({
    timestamp
  }, i) => xDomain ? timestamp : i);
  const scaleX = (0, _d3Scale.scaleLinear)().domain(xDomain ?? [Math.min(...timestamps), Math.max(...timestamps)]).range([0, width]);
  const scaleY = (0, _d3Scale.scaleLinear)().domain([yDomain.min, yDomain.max]).range([height - gutter, gutter]);
  const path = shape.line().defined(d => from || to ? !!data.slice(from, to ? to + 1 : undefined).find(item => item.timestamp === d.timestamp) : true).x((_, i) => scaleX(xDomain ? timestamps[i] ?? i : i)).y(d => scaleY(d.value)).curve(_shape)(data);
  return path || '';
}
//# sourceMappingURL=getPath.js.map