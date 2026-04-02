import React from 'react';
import type { TextProps as RNTextProps } from 'react-native';
import type { AnimatedProps } from 'react-native-reanimated';
import type { TFormatterFn } from '../../types';
import type { TPriceType } from './types';
export type CandlestickChartPriceTextProps = {
    format?: TFormatterFn<string>;
    precision?: number;
    variant?: 'formatted' | 'value';
    type?: TPriceType;
    style?: AnimatedProps<RNTextProps>['style'];
};
export declare function CandlestickChartPriceText({ format, precision, variant, type, style, }: CandlestickChartPriceTextProps): React.JSX.Element;
//# sourceMappingURL=PriceText.d.ts.map