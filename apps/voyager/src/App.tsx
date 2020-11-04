import "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
enableScreens();

import React, { useRef, useEffect } from "react";
import { Animated, Easing } from "react-native";
import { observer } from "mobx-react-lite";
import { Dimensions } from "react-native";
import Logo from "@/components/logo";
import { AppState } from "@/states";
import { AuthScreen, CreateRideScreen } from "@/screens";

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

  useEffect(() => {
    if (!AppState.initializing) {
      setValue(64);
    }

    if (AppState.token) {
      setValue(-70);
    }
  }, [AppState.initializing, AppState.token]);

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
      {!AppState.initializing ? (
        AppState.token ? (
          <CreateRideScreen />
        ) : (
          <AuthScreen />
        )
      ) : null}
    </>
  );
}

export default observer(App);
