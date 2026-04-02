import * as React from 'react';
import { AnimatedProps } from 'react-native-reanimated';
import { PathProps } from 'react-native-svg';
export type LineChartGradientProps = AnimatedProps<PathProps> & {
    color?: string;
    children?: React.ReactNode;
};
export declare function LineChartGradient({ color: overrideColor, children, ...props }: LineChartGradientProps): React.JSX.Element;
export declare namespace LineChartGradient {
    var displayName: string;
}
//# sourceMappingURL=Gradient.d.ts.map