import React from 'react';
import * as d3Shape from 'd3-shape';
import { ViewProps } from 'react-native';
import { Path } from 'react-native-redash';
export declare const LineChartDimensionsContext: React.Context<{
    width: number;
    height: number;
    pointWidth: number;
    parsedPath: Path;
    path: string;
    area: string;
    shape: d3Shape.CurveFactory;
    gutter: number;
    pathWidth: number;
}>;
export type LineChartProps = ViewProps & {
    children: React.ReactNode;
    yGutter?: number;
    width?: number;
    height?: number;
    shape?: d3Shape.CurveFactory;
    /**
     * If your `LineChart.Provider` uses a dictionary with multiple IDs for multiple paths, then this field is required.
     */
    id?: string;
    absolute?: boolean;
};
export declare function LineChart({ children, yGutter, width, height, shape, id, absolute, ...props }: LineChartProps): React.JSX.Element;
export declare namespace LineChart {
    var displayName: string;
}
//# sourceMappingURL=Chart.d.ts.map