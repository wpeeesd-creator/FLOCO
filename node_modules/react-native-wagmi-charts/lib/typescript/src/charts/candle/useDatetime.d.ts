import type { TFormatterFn } from '../../types';
import type { SharedValue } from 'react-native-reanimated';
export declare function useCandlestickChartDatetime({ format, locale, options, }?: {
    format?: TFormatterFn<number>;
    locale?: string;
    options?: {
        [key: string]: string;
    };
}): {
    value: Readonly<SharedValue<string>>;
    formatted: Readonly<SharedValue<string>>;
};
//# sourceMappingURL=useDatetime.d.ts.map