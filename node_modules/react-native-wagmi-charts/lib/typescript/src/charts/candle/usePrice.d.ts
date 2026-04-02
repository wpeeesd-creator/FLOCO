import type { TFormatterFn } from '../../types';
import type { TPriceType } from './types';
import type { SharedValue } from 'react-native-reanimated';
export declare function useCandlestickChartPrice({ format, precision, type, }?: {
    format?: TFormatterFn<string>;
    precision?: number;
    type?: TPriceType;
}): {
    value: Readonly<SharedValue<string>>;
    formatted: Readonly<SharedValue<string>>;
};
//# sourceMappingURL=usePrice.d.ts.map