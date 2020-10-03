import React, { FC, useRef, useEffect } from "react";
import { Animated, Easing, ViewProps } from "react-native";
import Svg, {
  SvgProps,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

export const Lines: FC<SvgProps> = (props) => {
  return (
    <Svg width={421} height={109} viewBox="0 0 421 109" fill="none" {...props}>
      <Path
        d="M0 38c70.941 48.5 203.139 37.663 253.394 22.5C347.851 32 393.162 71.5 420 97M0 64.5c103.765 54.5 203.139 22.163 253.394 7C347.851 43 393.162 62.5 420 88M0 1c12.353 32.5 140.813 80.443 251.651 47C346.108 19.5 393.162 82.5 420 108"
        stroke="url(#prefix__paint0_linear)"
        strokeWidth={1.5}
      />
      <Defs>
        <LinearGradient
          id="prefix__paint0_linear"
          x1={-4.941}
          y1={35.5}
          x2={421.351}
          y2={59.493}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0.0} stopColor="#0047FF" stopOpacity={0} />
          <Stop offset={0.203} stopColor="#0047FF" />
          <Stop offset={0.359} stopColor="#0047FF" stopOpacity={0.43} />
          <Stop offset={0.881} stopColor="#0047FF" />
          <Stop offset={1} stopColor="#0047FF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
    </Svg>
  );
};

export const AnimatedSetup: FC<
  Animated.AnimatedProps<ViewProps> & { delay?: number }
> = ({ style, delay = 0, ...props }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      delay,
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad),
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
        },
        style,
      ]}
      {...props}
    ></Animated.View>
  );
};
