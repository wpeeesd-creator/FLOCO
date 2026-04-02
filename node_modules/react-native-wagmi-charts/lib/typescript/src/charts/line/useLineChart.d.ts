export declare function useLineChart(): {
    currentY: import("react-native-reanimated").DerivedValue<number>;
    data: import("./types").TLineChartData | undefined;
    currentX: import("react-native-reanimated").SharedValue<number>;
    currentIndex: import("react-native-reanimated").SharedValue<number>;
    isActive: import("react-native-reanimated").SharedValue<boolean>;
    domain: [number, number];
    yDomain: import("./types").YDomain;
    xLength: number;
    xDomain?: [number, number] | undefined;
};
//# sourceMappingURL=useLineChart.d.ts.map