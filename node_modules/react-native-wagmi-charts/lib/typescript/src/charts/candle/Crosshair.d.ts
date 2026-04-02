import React from 'react';
import { ViewProps } from 'react-native';
import { AnimatedProps } from 'react-native-reanimated';
import { CandlestickChartLineProps } from './Line';
type CandlestickChartCrosshairProps = {
    color?: string;
    children?: React.ReactNode;
    onCurrentXChange?: (value: number) => unknown;
    horizontalCrosshairProps?: AnimatedProps<ViewProps>;
    verticalCrosshairProps?: AnimatedProps<ViewProps>;
    lineProps?: Partial<CandlestickChartLineProps>;
    minDurationMs?: number;
};
export declare function CandlestickChartCrosshair({ color, onCurrentXChange, children, horizontalCrosshairProps, verticalCrosshairProps, lineProps, minDurationMs, }: CandlestickChartCrosshairProps): React.JSX.Element;
export {};
//# sourceMappingURL=Crosshair.d.ts.map