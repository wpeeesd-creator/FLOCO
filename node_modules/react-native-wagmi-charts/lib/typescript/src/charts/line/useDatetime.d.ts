import type { TFormatterFn } from '../../types';
export declare function useLineChartDatetime({ format, locale, options, }?: {
    format?: TFormatterFn<number>;
    locale?: string;
    options?: Intl.DateTimeFormatOptions;
}): {
    value: import("react-native-reanimated").DerivedValue<number>;
    formatted: import("react-native-reanimated").DerivedValue<string>;
};
//# sourceMappingURL=useDatetime.d.ts.map