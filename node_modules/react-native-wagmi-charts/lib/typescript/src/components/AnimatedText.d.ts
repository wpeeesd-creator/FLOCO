import React from 'react';
import { TextProps as RNTextProps } from 'react-native';
import type { SharedValue, AnimatedProps } from 'react-native-reanimated';
interface AnimatedTextProps {
    text: SharedValue<string>;
    style?: AnimatedProps<RNTextProps>['style'];
}
export declare const AnimatedText: ({ text, style }: AnimatedTextProps) => React.JSX.Element;
export {};
//# sourceMappingURL=AnimatedText.d.ts.map