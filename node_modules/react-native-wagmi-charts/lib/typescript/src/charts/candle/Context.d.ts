import React from 'react';
import type { TContext, TData, TDomain } from './types';
export declare const CandlestickChartContext: React.Context<TContext>;
type CandlestickChartProviderProps = {
    children: React.ReactNode;
    data: TData;
    valueRangeY?: TDomain;
    onCurrentIndexChange?: (x: number) => void;
};
export declare function CandlestickChartProvider({ children, data, valueRangeY, onCurrentIndexChange, }: CandlestickChartProviderProps): React.JSX.Element;
export declare namespace CandlestickChartProvider {
    var displayName: string;
}
export {};
//# sourceMappingURL=Context.d.ts.map