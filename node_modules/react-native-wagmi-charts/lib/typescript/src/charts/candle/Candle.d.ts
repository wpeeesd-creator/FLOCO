import React from 'react';
import { ColorValue } from 'react-native';
import { LineProps, NumberProp, RectProps } from 'react-native-svg';
import type { TCandle, TDomain } from './types';
export type CandlestickChartCandleProps = {
    candle: TCandle;
    domain: TDomain;
    maxHeight: number;
    margin?: number;
    positiveColor?: string;
    negativeColor?: string;
    index: number;
    width: number;
    rectProps?: RectProps;
    lineProps?: LineProps;
    useAnimations?: boolean;
    renderRect?: (renderRectOptions: {
        x: NumberProp;
        y: NumberProp;
        width: NumberProp;
        height: NumberProp;
        fill: ColorValue;
        useAnimations: boolean;
        candle: TCandle;
    }) => React.ReactNode;
    renderLine?: (renderLineOptions: {
        x1: NumberProp;
        y1: NumberProp;
        x2: NumberProp;
        y2: NumberProp;
        stroke: ColorValue;
        strokeWidth: NumberProp;
        useAnimations: boolean;
        candle: TCandle;
    }) => React.ReactNode;
};
export declare const CandlestickChartCandle: ({ candle, maxHeight, domain, margin, positiveColor, negativeColor, rectProps: overrideRectProps, lineProps: overrideLineProps, index, width, useAnimations, renderLine, renderRect, }: CandlestickChartCandleProps) => React.JSX.Element;
//# sourceMappingURL=Candle.d.ts.map