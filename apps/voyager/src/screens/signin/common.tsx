import React, { useRef, useEffect, FC } from "react";
import {
  StyleSheet,
  Animated,
  Easing,
  PressableProps,
  ActivityIndicator,
  Text,
  TextProps,
} from "react-native";
import { observer } from "mobx-react-lite";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import { Button } from "@components/atoms";
import { StackScreenProps } from "@react-navigation/stack";
import UIStore from "@stores/ui.store";

export enum SignInScreens {
  Identify = "Identify",
  Password = "Password",
  Code = "Code",
  RecoveryPassword = "RecoveryPassword",
}

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

const easing = Easing.bezier(0.88, 0.02, 0.16, 1.02);

export const NextButton: FC<
  PressableProps & { loading?: boolean; visible: boolean }
> = ({ visible, loading, ...props }) => {
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
    console.log("Set", visible);
    setButtonVisibility(visible);
  }, [visible]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        right: -4,
        transform: [{ scaleY: buttonScale }, { translateX: buttonPosition }],
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
        {loading ? (
          <ActivityIndicator color={UIStore.theme.colors.onPrimary} />
        ) : (
          <MaterialIcons name="chevron-right" size={24} />
        )}
      </Button>
    </Animated.View>
  );
};

export type Props = StackScreenProps<{
  [SignInScreens.Code]: undefined;
  [SignInScreens.Password]: undefined;
  [SignInScreens.RecoveryPassword]: undefined;
}>;

export const Error: FC<TextProps & { error?: string }> = observer(
  ({ style, error, ...props }) => {
    return error ? (
      <Text
        style={[
          {
            color: UIStore.theme.colors.error,
            textAlign: "center",
            fontWeight: "bold",
          },
          style,
        ]}
        {...props}
      >
        {error}
      </Text>
    ) : null;
  },
);
