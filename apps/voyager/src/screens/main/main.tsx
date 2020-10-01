import React, { useRef, useEffect } from "react";
import { View, Text, Animated, Easing, Dimensions } from "react-native";
import MapView from "react-native-maps";
import { observer } from "mobx-react-lite";
import { UIStore } from "@stores";

const { width, height } = Dimensions.get("window");

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
        opacity: opacityAnim,
      }}
    >
      <MapView
        style={{ width, height: height - 26, top: 26 }}
        provider="google"
        showsBuildings={false}
        loadingEnabled
        showsPointsOfInterest={false}
        loadingIndicatorColor={UIStore.theme.colors.onBackground}
        loadingBackgroundColor={UIStore.theme.colors.background}
        //customMapStyle={UIStore.theme.mapStyle}
      />
    </Animated.View>
  );
});
