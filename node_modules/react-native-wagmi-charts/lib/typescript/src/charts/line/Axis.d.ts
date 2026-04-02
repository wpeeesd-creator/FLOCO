import React from 'react';
import { ViewProps, TextStyle, ViewStyle } from 'react-native';
export type LineChartAxisPosition = 'left' | 'right' | 'top' | 'bottom';
export type LineChartAxisOrientation = 'horizontal' | 'vertical';
export type LineChartAxisProps = ViewProps & {
    position: LineChartAxisPosition;
    orientation: LineChartAxisOrientation;
    color?: string;
    strokeWidth?: number;
    tickCount?: number;
    domain?: [number, number];
    hideOnInteraction?: boolean;
    format?: (value: number | string) => string | number;
    textStyle?: TextStyle;
    labelPadding?: number;
    labelWidth?: number;
    containerStyle?: ViewStyle;
};
export declare const LineChartAxis: ({ position, orientation, color, strokeWidth, tickCount, domain, hideOnInteraction, format, textStyle, labelPadding, containerStyle, ...props }: LineChartAxisProps) => React.JSX.Element;
//# sourceMappingURL=Axis.d.ts.map