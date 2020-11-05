import React, { useRef, useEffect, FC, Children } from "react";
import {
  View,
  ScrollView,
  Animated,
  Easing,
  PressableProps,
  ActivityIndicator,
  Text,
  TextProps,
} from "react-native";
import { observer } from "mobx-react-lite";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import { Button } from "@/components/atoms";
import UIStore from "@/states/ui.store";
import { PrimaryThemeColorsProperties } from "@/types";
import { styles } from "./styles";

const easing = Easing.bezier(0.88, 0.02, 0.16, 1.02);

export const NextButton: FC<
  PressableProps & {
    loading?: boolean;
    visible: boolean;
    mode: "full" | "attached";
  }
> = ({ visible, loading, mode, children, ...props }) => {
  const buttonPosition = useRef(new Animated.Value(100)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  const setButtonVisibility = (state: boolean) => {
    Animated.timing(buttonScale, {
      toValue: Number(state),
      duration: 600,
      useNativeDriver: true,
      easing,
    }).start();

    Animated.timing(buttonPosition, {
      toValue: state ? 0 : 100,
      duration: 600,
      useNativeDriver: true,
      easing,
    }).start();
  };

  useEffect(() => {
    setButtonVisibility(visible);
  }, [visible]);

  const containerStyle: any =
    mode === "attached"
      ? {
          position: "absolute",
          top: 0,
          right: -4,
          transform: [{ translateX: buttonPosition }],
        }
      : {
          width: "100%",
          opacity: buttonScale,
        };
  const buttonStyle: any =
    mode === "attached"
      ? {
          width: 40,
          height: 40,
          paddingVertical: 8,
          paddingLeft: 15,
          backfaceVisibility: "visible",
          borderRadius: 50,
        }
      : { width: "100%", paddingVertical: 8, backfaceVisibility: "visible" };

  const label =
    mode === "attached" ? (
      <MaterialIcons name="chevron-right" size={24} />
    ) : (
      children
    );

  return (
    <Animated.View style={containerStyle}>
      <Button type="primary" style={buttonStyle} {...props}>
        {loading ? (
          <ActivityIndicator color={UIStore.theme.colors.onPrimary} />
        ) : (
          label
        )}
      </Button>
    </Animated.View>
  );
};

export const Alert: FC<
  TextProps & {
    visible: boolean;
    type: keyof Pick<
      PrimaryThemeColorsProperties,
      "success" | "error" | "warn"
    >;
  }
> = observer(({ style, type, children, visible, ...props }) => {
  return visible ? (
    <Text
      style={[
        {
          color: UIStore.theme.colors[type],
          textAlign: "center",
          fontWeight: "bold",
          marginBottom: 12,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  ) : null;
});

export const Container: FC = ({ children }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={{
          width: "100%",
          paddingHorizontal: "10%",
        }}
        contentContainerStyle={{
          width: "100%",
          alignItems: "center",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {children}
      </ScrollView>
    </View>
  );
};
