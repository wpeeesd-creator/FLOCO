import React from 'react';
import type { StyleProp, TextStyle, ViewProps } from 'react-native';
import type { SharedValue, AnimatedStyle } from 'react-native-reanimated';
import { CandlestickChartPriceTextProps } from './PriceText';
export type CandlestickChartCrosshairTooltipProps = ViewProps & {
    children?: React.ReactNode;
    xGutter?: number;
    yGutter?: number;
    tooltipTextProps?: CandlestickChartPriceTextProps;
    textStyle?: AnimatedStyle<StyleProp<TextStyle>>;
};
export type CandlestickChartCrosshairTooltipContext = {
    position: SharedValue<'left' | 'right'>;
};
export declare const CandlestickChartCrosshairTooltipContext: React.Context<CandlestickChartCrosshairTooltipContext>;
export declare function CandlestickChartCrosshairTooltip({ children, xGutter, yGutter, tooltipTextProps, textStyle, ...props }: CandlestickChartCrosshairTooltipProps): React.JSX.Element;
//# sourceMappingURL=CrosshairTooltip.d.ts.map