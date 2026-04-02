import React from 'react';
import type { TextProps as RNTextProps } from 'react-native';
import type { AnimatedProps } from 'react-native-reanimated';
import type { TFormatterFn } from '../../types';
type CandlestickChartPriceTextProps = {
    locale?: string;
    options?: {
        [key: string]: string;
    };
    format?: TFormatterFn<number>;
    variant?: 'formatted' | 'value';
    style?: AnimatedProps<RNTextProps>['style'];
};
export declare function CandlestickChartDatetimeText({ locale, options, format, variant, style, }: CandlestickChartPriceTextProps): React.JSX.Element;
export {};
//# sourceMappingURL=DatetimeText.d.ts.map