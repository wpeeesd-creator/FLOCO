import React from 'react';
import { AnimatedProps } from 'react-native-reanimated';
import { LineChartPriceTextProps } from './PriceText';
import type { ViewProps } from 'react-native';
import type { TFormatterFn } from '../../types';
export type LineChartTooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type LineChartTooltipProps = AnimatedProps<ViewProps> & {
    children?: React.ReactNode;
    format?: TFormatterFn<string>;
    xGutter?: number;
    yGutter?: number;
    cursorGutter?: number;
    position?: LineChartTooltipPosition;
    withHorizontalFloating?: boolean;
    textProps?: LineChartPriceTextProps;
    textStyle?: LineChartPriceTextProps['style'];
    /**
     * When specified the tooltip is considered static, and will
     * always be rendered at the given index, unless there is interaction
     * with the chart (like interacting with a cursor).
     *
     * @default undefined
     */
    at?: number;
};
export declare function LineChartTooltip({ children, format, xGutter, yGutter, cursorGutter, position, withHorizontalFloating, textProps, textStyle, at, ...props }: LineChartTooltipProps): React.JSX.Element;
export declare namespace LineChartTooltip {
    var displayName: string;
}
//# sourceMappingURL=Tooltip.d.ts.map