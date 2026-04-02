"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePrevious = usePrevious;
var _react = _interopRequireDefault(require("react"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function usePrevious(value) {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = _react.default.useRef();
  // Store current value in ref
  _react.default.useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  // Return previous value (happens before update in useEffect above)
  return ref.current;
}
//# sourceMappingURL=usePrevious.js.map