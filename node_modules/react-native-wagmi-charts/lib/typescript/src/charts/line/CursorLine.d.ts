import React from 'react';
import { type TextStyle } from 'react-native';
import { type LineProps } from 'react-native-svg';
import type { TFormatterFn } from '../../types';
import { type LineChartCursorProps } from './Cursor';
type LineChartCursorLineProps = {
    children?: React.ReactNode;
    color?: string;
    lineProps?: Partial<LineProps>;
    format?: TFormatterFn<string | number>;
    textStyle?: TextStyle;
    persistOnEnd?: boolean;
} & Omit<LineChartCursorProps, 'type' | 'children'>;
export declare function LineChartCursorLine({ children, color, lineProps, format, textStyle, ...cursorProps }: LineChartCursorLineProps): React.JSX.Element;
export declare namespace LineChartCursorLine {
    var displayName: string;
}
export {};
//# sourceMappingURL=CursorLine.d.ts.map