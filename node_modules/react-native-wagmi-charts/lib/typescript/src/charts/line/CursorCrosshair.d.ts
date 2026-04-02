import React from 'react';
import { ViewProps } from 'react-native';
import { AnimatedProps } from 'react-native-reanimated';
import { LineChartCursorProps } from './Cursor';
type LineChartCursorCrosshairProps = Omit<LineChartCursorProps, 'children' | 'type'> & {
    children?: React.ReactNode;
    color?: string;
    size?: number;
    outerSize?: number;
    crosshairWrapperProps?: AnimatedProps<ViewProps>;
    crosshairProps?: ViewProps;
    crosshairOuterProps?: ViewProps;
};
export declare function LineChartCursorCrosshair({ children, color, size, outerSize, crosshairWrapperProps, crosshairProps, crosshairOuterProps, ...props }: LineChartCursorCrosshairProps): React.JSX.Element;
export declare namespace LineChartCursorCrosshair {
    var displayName: string;
}
export {};
//# sourceMappingURL=CursorCrosshair.d.ts.map