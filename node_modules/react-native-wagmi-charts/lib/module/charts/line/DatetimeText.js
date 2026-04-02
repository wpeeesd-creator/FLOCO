import React from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import { useLineChartDatetime } from './useDatetime';
import { AnimatedText } from '../../components/AnimatedText';
LineChartDatetimeText.displayName = 'LineChartDatetimeText';
export function LineChartDatetimeText({
  locale,
  options,
  format,
  variant = 'formatted',
  style
}) {
  const datetime = useLineChartDatetime({
    format,
    locale,
    options
  });
  const text = useDerivedValue(() => {
    const value = datetime[variant].value;
    if (typeof value === 'number') {
      return value === 0 || isNaN(value) ? '' : value.toString();
    }
    return value || '';
  }, [datetime, variant]);
  return /*#__PURE__*/React.createElement(AnimatedText, {
    text: text,
    style: style
  });
}
//# sourceMappingURL=DatetimeText.js.map