import type { TFormatterFn } from '../../types';
export declare function useLineChartPrice({ format, precision, index, }?: {
    format?: TFormatterFn<string>;
    precision?: number;
    index?: number;
}): {
    value: import("react-native-reanimated").DerivedValue<string>;
    formatted: import("react-native-reanimated").DerivedValue<string>;
};
//# sourceMappingURL=usePrice.d.ts.map