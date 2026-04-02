// forked from https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx

import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { TextInput } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedReaction } from 'react-native-reanimated';
Animated.addWhitelistedNativeProps({
  text: true
});
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
export const AnimatedText = ({
  text,
  style
}) => {
  const inputRef = React.useRef(null);
  useAnimatedReaction(() => text.value, (data, prevData) => {
    // Only execute for web platform
    if (Platform.OS === 'web' && data !== prevData && inputRef.current) {
      // @ts-expect-error - web TextInput has value property
      inputRef.current.value = data;
    }
  }, [text]);
  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    };
  });
  return /*#__PURE__*/React.createElement(AnimatedTextInput, {
    underlineColorAndroid: "transparent",
    editable: false,
    ref: Platform.select({
      web: inputRef
    }),
    style: [styles.text, style],
    animatedProps: animatedProps
  });
};
const styles = StyleSheet.create({
  text: {
    color: 'black'
  }
});
//# sourceMappingURL=AnimatedText.js.map