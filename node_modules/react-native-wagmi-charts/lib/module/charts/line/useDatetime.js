import { useDerivedValue } from 'react-native-reanimated';
import { formatDatetime } from '../../utils';
import { useLineChart } from './useLineChart';
export function useLineChartDatetime({
  format,
  locale,
  options
} = {}) {
  const {
    currentIndex,
    data
  } = useLineChart();
  const timestamp = useDerivedValue(() => {
    if (!data || typeof currentIndex.value === 'undefined' || currentIndex.value === -1) {
      return '';
    }
    return data[currentIndex.value]?.timestamp ?? '';
  }, [currentIndex, data]);
  const value = useDerivedValue(() => new Date(timestamp.value).getTime(), [timestamp]);
  const formatted = useDerivedValue(() => {
    const formattedDatetime = value.value ? formatDatetime({
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