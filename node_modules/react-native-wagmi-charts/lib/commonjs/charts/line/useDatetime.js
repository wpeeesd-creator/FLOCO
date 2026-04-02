"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useLineChartDatetime = useLineChartDatetime;
var _reactNativeReanimated = require("react-native-reanimated");
var _utils = require("../../utils");
var _useLineChart = require("./useLineChart");
function useLineChartDatetime({
  format,
  locale,
  options
} = {}) {
  const {
    currentIndex,
    data
  } = (0, _useLineChart.useLineChart)();
  const timestamp = (0, _reactNativeReanimated.useDerivedValue)(() => {
    if (!data || typeof currentIndex.value === 'undefined' || currentIndex.value === -1) {
      return '';
    }
    return data[currentIndex.value]?.timestamp ?? '';
  }, [currentIndex, data]);
  const value = (0, _reactNativeReanimated.useDerivedValue)(() => new Date(timestamp.value).getTime(), [timestamp]);
  const formatted = (0, _reactNativeReanimated.useDerivedValue)(() => {
    const formattedDatetime = value.value ? (0, _utils.formatDatetime)({
      value: value.value,
      locale,
      options
    }) : '';
    return format ? format({
      value: value.value || -1,
      formatted: formattedDatetime
    }) : formattedDatetime;
  }, [format, locale, options, value]);
  return {
    value,
    formatted
  };
}
//# sourceMappingURL=useDatetime.js.map