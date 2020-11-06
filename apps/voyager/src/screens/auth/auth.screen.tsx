import React, { useRef, useEffect } from "react";
import { Animated, Easing, Dimensions } from "react-native";
import { observer } from "mobx-react-lite";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { UIStore } from "@/states";
import { LoginScreen } from "./login";
import { RegisterScreen } from "./register";
import { Lines } from "@/components/general";
import { AuthScreens } from "./interfaces";

const windowWidth = Dimensions.get("window").width;
const { Navigator, Screen } = createStackNavigator<Record<AuthScreens, any>>();

export const AuthScreen = observer(() => {
  const { theme } = UIStore;
  const navigatorTheme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.onBackground,
      border: theme.colors.background,
      notification: theme.colors.primaryVariant,
    },
  };
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
      <Lines width={windowWidth} />
      <NavigationContainer theme={navigatorTheme}>
        <Navigator
          initialRouteName="register"
          screenOptions={{
            headerTitle: (props) => <></>,
            headerTransparent: true,
          }}
        >
          <Screen name="login" component={LoginScreen} />
          <Screen name="register" component={RegisterScreen} />
        </Navigator>
      </NavigationContainer>
    </Animated.View>
  );
});
