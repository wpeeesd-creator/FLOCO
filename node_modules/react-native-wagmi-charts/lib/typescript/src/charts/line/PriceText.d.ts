import React from 'react';
import type { TextProps as RNTextProps } from 'react-native';
import type { AnimatedProps } from 'react-native-reanimated';
import type { TFormatterFn } from '../../types';
export type LineChartPriceTextProps = {
    format?: TFormatterFn<string>;
    precision?: number;
    variant?: 'formatted' | 'value';
    style?: AnimatedProps<RNTextProps>['style'];
    /**
     * By default, it will use the current active index from the chart.
     * If this is set it will use the index provided.
     */
    index?: number;
    /**
     * Use optimized rendering for high-frequency updates (bypasses AnimatedText)
     */
    useOptimizedRendering?: boolean;
    /**
     * Function to determine text color based on the formatted value
     */
    getTextColor?: (formattedValue: string) => string;
};
export declare function LineChartPriceText({ format, precision, variant, style, index, useOptimizedRendering, getTextColor, }: LineChartPriceTextProps): React.JSX.Element;
export declare namespace LineChartPriceText {
    var displayName: string;
}
//# sourceMappingURL=PriceText.d.ts.map