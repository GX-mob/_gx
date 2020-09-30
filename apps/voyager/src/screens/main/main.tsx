import React, { useRef, useEffect } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { observer } from "mobx-react-lite";

export const MainScreen = observer(() => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad),
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "blue",
        opacity: opacityAnim,
      }}
    >
      <Text>Main</Text>
    </Animated.View>
  );
});
