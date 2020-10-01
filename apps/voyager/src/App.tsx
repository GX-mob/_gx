import "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
enableScreens();

import React, { useRef } from "react";
import { Animated, Easing } from "react-native";
import { observer } from "mobx-react-lite";
import { Dimensions } from "react-native";
import Logo from "@components/logo";
import { LoginStore } from "@stores";
import { LoginScreen, MainScreen } from "@screens";

const easing = Easing.bezier(0.88, 0.02, 0.16, 1.02);
const windowHeight = Dimensions.get("window").height;
const initialPosition = windowHeight / 2 + 2.5;

function App() {
  const logoTranslateY = useRef(new Animated.Value(initialPosition)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  const setValue = (toValue: number) => {
    Animated.timing(logoTranslateY, {
      toValue,
      duration: 1000,
      useNativeDriver: true,
      easing,
    }).start();

    Animated.timing(logoScale, {
      toValue: 0.6,
      duration: 1000,
      useNativeDriver: true,
      easing,
    }).start();
  };

  if (!LoginStore.initializing) {
    setValue(64);
  }

  if (LoginStore.token) {
    setValue(-70);
  }

  return (
    <>
      <Animated.View
        style={{
          position: "absolute",
          alignSelf: "center",
          top: -42,
          zIndex: 99,
          transform: [{ translateY: logoTranslateY }, { scale: logoScale }],
        }}
      >
        <Logo width="78" height="79" />
      </Animated.View>
      {!LoginStore.initializing ? (
        LoginStore.token ? (
          <MainScreen />
        ) : (
          <LoginScreen />
        )
      ) : null}
    </>
  );
}

export default observer(App);
