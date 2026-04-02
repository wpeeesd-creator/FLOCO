import React from 'react';
export type LineChartCursorProps = {
    children: React.ReactNode;
    type: 'line' | 'crosshair';
    snapToPoint?: boolean;
    at?: number;
    shouldCancelWhenOutside?: boolean;
    minDurationMs?: number;
    onActivated?: () => void;
    onEnded?: () => void;
    orientation?: 'horizontal' | 'vertical';
    persistOnEnd?: boolean;
};
export declare const CursorContext: React.Context<{
    type: string;
}>;
export declare function LineChartCursor({ children, snapToPoint, type, at, shouldCancelWhenOutside, persistOnEnd, minDurationMs, onActivated, onEnded, }: LineChartCursorProps): React.JSX.Element;
export declare namespace LineChartCursor {
    var displayName: string;
}
//# sourceMappingURL=Cursor.d.ts.map