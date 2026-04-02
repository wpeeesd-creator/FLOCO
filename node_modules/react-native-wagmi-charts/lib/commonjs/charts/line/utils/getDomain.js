"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDomain = getDomain;
function getDomain(rows) {
  'worklet';

  if (rows.length === 0) return [0, 0];
  const values = rows.map(({
    value
  }) => value);
  return [Math.min(...values), Math.max(...values)];
}
//# sourceMappingURL=getDomain.js.map