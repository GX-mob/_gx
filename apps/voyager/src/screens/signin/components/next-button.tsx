import React, { useRef, FC } from "react";
import { Animated, Easing, TouchableHighlightProps } from "react-native";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import { Button } from "@components/atoms";
import { UIStore } from "@stores";

export const NextButton: FC<TouchableHighlightProps & { visible: boolean }> = (
  props,
) => {
  const buttonScale = useRef(new Animated.Value(0)).current;

  const setButtonVisibility = (state: boolean) => {
    Animated.timing(buttonScale, {
      toValue: Number(state),
      duration: 300,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad),
    }).start();
  };

  setButtonVisibility(props.visible);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        right: -4,
        transform: [{ scale: buttonScale }],
      }}
    >
      <Button
        type="primary"
        style={{
          width: 60,
          height: 40,
          paddingVertical: 8,
        }}
        {...props}
      >
        <MaterialIcons name="chevron-right" size={24} />
      </Button>
    </Animated.View>
  );
};
