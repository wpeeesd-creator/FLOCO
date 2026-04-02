"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineChartHoverTrap = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _Chart = require("../Chart");
var _useLineChart = require("../useLineChart");
var _ExecutionEnvironment = require("fbjs/lib/ExecutionEnvironment");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Minimum time in milliseconds that must pass between touch events before a
 * hover state is activated on web.
 */
const HOVER_THRESHOLD_MS = 1000;

/**
 * Hover state manager for web platform. This singleton ensures global hover
 * detection is properly initialized and cleaned up.
 */
class HoverStateManager {
  isEnabled = false;
  lastTouchTimestamp = 0;
  initialized = false;
  constructor() {
    if (_ExecutionEnvironment.canUseDOM) {
      this.initialize();
    }
  }
  initialize() {
    if (this.initialized) return;

    /**
     * The following logic comes from the creator of react-native-web:
     * https://gist.github.com/necolas/1c494e44e23eb7f8c5864a2fac66299a
     * It's also used by MotiPressable's hover interactions:
     * https://github.com/nandorojo/moti/blob/master/packages/interactions/src/pressable/hoverable.tsx
     *
     * Web browsers emulate mouse events (and hover states) after touch events.
     * This code infers when the currently-in-use modality supports hover
     * (including for multi-modality devices) and considers "hover" to be enabled
     * if a mouse movement occurs more than 1 second after the last touch event.
     * This threshold is long enough to account for longer delays between the
     * browser firing touch and mouse events on low-powered devices.
     */
    document.addEventListener('touchstart', this.disableHover, true);
    document.addEventListener('touchmove', this.disableHover, true);
    document.addEventListener('mousemove', this.enableHover, true);
    this.initialized = true;
  }
  enableHover = () => {
    if (this.isEnabled || Date.now() - this.lastTouchTimestamp < HOVER_THRESHOLD_MS) {
      return;
    }
    this.isEnabled = true;
  };
  disableHover = () => {
    this.lastTouchTimestamp = Date.now();
    if (this.isEnabled) {
      this.isEnabled = false;
    }
  };
  isHoverEnabled() {
    return this.isEnabled;
  }

  /**
   * Cleanup method for removing event listeners. Note: In practice, this may
   * never be called since these are app-level listeners, but it's provided for
   * completeness and testing purposes.
   */
  cleanup() {
    if (!this.initialized || !_ExecutionEnvironment.canUseDOM) return;
    document.removeEventListener('touchstart', this.disableHover, true);
    document.removeEventListener('touchmove', this.disableHover, true);
    document.removeEventListener('mousemove', this.enableHover, true);
    this.initialized = false;
  }
}

// Singleton instance
const hoverStateManager = new HoverStateManager();
const LineChartHoverTrap = () => {
  const {
    width,
    parsedPath
  } = _react.default.useContext(_Chart.LineChartDimensionsContext);
  const {
    currentX,
    currentIndex,
    isActive,
    data
  } = (0, _useLineChart.useLineChart)();
  const onMouseMove = _react.default.useCallback(e => {
    if (!hoverStateManager.isHoverEnabled()) {
      isActive.value = false;
      currentIndex.value = -1;
      return;
    }
    if (!parsedPath) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const boundedX = Math.min(e.clientX - rect.left, width);
    isActive.value = true;
    currentX.value = boundedX;

    // on Web, we could drag the cursor to be negative, breaking it
    // so we clamp the index at 0 to fix it
    // https://github.com/coinjar/react-native-wagmi-charts/issues/24
    const minIndex = 0;
    const boundedIndex = Math.max(minIndex, Math.round(boundedX / width / (1 / (data ? data.length - 1 : 1))));
    currentIndex.value = boundedIndex;
  }, [currentIndex, currentX, data, isActive, parsedPath, width]);
  const onMouseLeave = _react.default.useCallback(() => {
    isActive.value = false;
    currentIndex.value = -1;
  }, [currentIndex, isActive]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: _reactNative.StyleSheet.absoluteFill
    // @ts-expect-error mouse move event
    ,
    onMouseMove: onMouseMove,
    onMouseLeave: onMouseLeave
  });
};
exports.LineChartHoverTrap = LineChartHoverTrap;
//# sourceMappingURL=index.web.js.map