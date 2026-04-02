"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CursorContext = void 0;
exports.LineChartCursor = LineChartCursor;
var _react = _interopRequireWildcard(require("react"));
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _reactNativeGestureHandler = require("react-native-gesture-handler");
var _Chart = require("./Chart");
var _reactNative = require("react-native");
var _d3Array = require("d3-array");
var _d3Scale = require("d3-scale");
var _useLineChart = require("./useLineChart");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const CursorContext = exports.CursorContext = /*#__PURE__*/_react.default.createContext({
  type: ''
});
LineChartCursor.displayName = 'LineChartCursor';
function LineChartCursor({
  children,
  snapToPoint,
  type,
  at,
  shouldCancelWhenOutside = false,
  persistOnEnd = false,
  minDurationMs = 0,
  onActivated,
  onEnded
}) {
  const {
    pathWidth: width,
    parsedPath
  } = _react.default.useContext(_Chart.LineChartDimensionsContext);
  const {
    currentX,
    currentIndex,
    isActive,
    data,
    xDomain
  } = (0, _useLineChart.useLineChart)();
  const xValues = _react.default.useMemo(() => (data ?? []).map(({
    timestamp
  }, i) => xDomain ? timestamp : i), [data, xDomain]);

  // Same scale as in /src/charts/line/utils/getPath.ts
  const scaleX = _react.default.useMemo(() => {
    const domainArray = xDomain ?? [0, xValues.length];
    return (0, _d3Scale.scaleLinear)().domain(domainArray).range([0, width]);
  }, [width, xDomain, xValues.length]);
  const linearScalePositionAndIndex = ({
    xPosition
  }) => {
    if (!parsedPath) {
      return;
    }

    // Calculate a scaled timestamp for the current touch position
    const xRelative = scaleX.invert(xPosition);
    const closestIndex = (0, _d3Array.bisectCenter)(xValues, xRelative);
    const pathDataDelta = Math.abs(parsedPath.curves.length - xValues.length); // sometimes there is a difference between data length and number of path curves.
    const closestPathCurve = Math.max(Math.min(closestIndex, parsedPath.curves.length + 1) - pathDataDelta, 0);
    const curveSegment = closestIndex > 0 && parsedPath.curves[closestPathCurve] ? parsedPath.curves[closestPathCurve] : null;
    const newXPosition = (curveSegment ? curveSegment.to : parsedPath.move).x;
    // Update values
    currentIndex.value = closestIndex;
    currentX.value = newXPosition;
  };
  (0, _react.useEffect)(() => {
    if (at !== undefined) {
      const xPosition = scaleX(at);
      (0, _reactNativeReanimated.runOnJS)(linearScalePositionAndIndex)({
        xPosition
      });
      isActive.value = true;
    }
  }, [at, scaleX]);
  const updatePosition = xPosition => {
    'worklet';

    if (parsedPath) {
      // on Web, we could drag the cursor to be negative, breaking it
      // so we clamp the index at 0 to fix it
      // https://github.com/coinjar/react-native-wagmi-charts/issues/24
      const minIndex = 0;
      const boundedIndex = Math.max(minIndex, Math.round(xPosition / width / (1 / (data ? data.length - 1 : 1))));
      if (snapToPoint) {
        // We have to run this on the JS thread unfortunately as the scaleLinear functions won't work on UI thread
        (0, _reactNativeReanimated.runOnJS)(linearScalePositionAndIndex)({
          xPosition
        });
      } else if (!snapToPoint) {
        currentX.value = xPosition;
        currentIndex.value = boundedIndex;
      }
    }
  };
  const longPressGesture = _reactNativeGestureHandler.Gesture.LongPress().minDuration(minDurationMs ?? 0).maxDistance(999999).shouldCancelWhenOutside(shouldCancelWhenOutside).onStart(event => {
    'worklet';

    if (parsedPath) {
      const xPosition = Math.max(0, event.x <= width ? event.x : width);
      isActive.value = true;
      updatePosition(xPosition);
      if (onActivated) {
        (0, _reactNativeReanimated.runOnJS)(onActivated)();
      }
    }
  }).onTouchesMove(event => {
    'worklet';

    if (parsedPath && isActive.value && event.allTouches.length > 0 && event.allTouches[0]) {
      const touchX = event.allTouches[0].x;
      const xPosition = Math.max(0, touchX <= width ? touchX : width);
      updatePosition(xPosition);
    }
  }).onEnd(() => {
    'worklet';

    if (!persistOnEnd) {
      isActive.value = false;
      currentIndex.value = -1;
    }
    if (onEnded) {
      (0, _reactNativeReanimated.runOnJS)(onEnded)();
    }
  });
  return /*#__PURE__*/_react.default.createElement(CursorContext.Provider, {
    value: {
      type
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNativeGestureHandler.GestureDetector, {
    gesture: longPressGesture
  }, /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, {
    style: _reactNative.StyleSheet.absoluteFill
  }, children)));
}
//# sourceMappingURL=Cursor.js.map