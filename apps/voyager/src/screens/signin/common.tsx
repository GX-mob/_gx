import React, { useRef, FC } from "react";
import {
  StyleSheet,
  Animated,
  Easing,
  TouchableHighlightProps,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import { Button } from "@components/atoms";
import { UIStore } from "@stores";

export const styles = StyleSheet.create({
  container: {
    width: "80%",
    height: "100%",
    marginHorizontal: "10%",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingVertical: 12,
  },
  title: {
    alignSelf: "flex-start",
    fontSize: 16,
    marginVertical: 4,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  subTitle: {
    alignSelf: "flex-start",
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "100",
  },
});

export const NextButton: FC<TouchableHighlightProps & { visible: boolean }> = (
  props,
) => {
  const buttonPosition = useRef(new Animated.Value(-60)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  const setButtonVisibility = (state: boolean) => {
    Animated.timing(buttonScale, {
      toValue: Number(state),
      duration: 300,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad),
    }).start();

    Animated.timing(buttonPosition, {
      toValue: state ? 0 : 60,
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
        transform: [{ scaleY: buttonScale, translateX: buttonPosition }],
      }}
    >
      <Button
        type="primary"
        style={{
          width: 60,
          height: 40,
          paddingVertical: 8,
          backfaceVisibility: "visible",
        }}
        {...props}
      >
        <MaterialIcons name="chevron-right" size={24} />
      </Button>
    </Animated.View>
  );
};
