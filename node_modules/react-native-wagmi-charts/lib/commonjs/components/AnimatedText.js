"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnimatedText = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// forked from https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx

_reactNativeReanimated.default.addWhitelistedNativeProps({
  text: true
});
const AnimatedTextInput = _reactNativeReanimated.default.createAnimatedComponent(_reactNative.TextInput);
const AnimatedText = ({
  text,
  style
}) => {
  const inputRef = _react.default.useRef(null);
  (0, _reactNativeReanimated.useAnimatedReaction)(() => text.value, (data, prevData) => {
    // Only execute for web platform
    if (_reactNative.Platform.OS === 'web' && data !== prevData && inputRef.current) {
      // @ts-expect-error - web TextInput has value property
      inputRef.current.value = data;
    }
  }, [text]);
  const animatedProps = (0, _reactNativeReanimated.useAnimatedProps)(() => {
    return {
      text: text.value
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    };
  });
  return /*#__PURE__*/_react.default.createElement(AnimatedTextInput, {
    underlineColorAndroid: "transparent",
    editable: false,
    ref: _reactNative.Platform.select({
      web: inputRef
    }),
    style: [styles.text, style],
    animatedProps: animatedProps
  });
};
exports.AnimatedText = AnimatedText;
const styles = _reactNative.StyleSheet.create({
  text: {
    color: 'black'
  }
});
//# sourceMappingURL=AnimatedText.js.map