import React, { useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Dimensions, Animated, Easing } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { UIStore } from "@stores";
import { Lines } from "@components/general";
import { SignInScreens } from "./common";
import { IdentifyStep } from "./identify.step";
import { PasswordStep } from "./password.step";
import { CodeStep } from "./code.step";

const { Navigator, Screen } = createStackNavigator();
const windowWidth = Dimensions.get("window").width;

export const LoginScreen = observer(() => {
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
          screenOptions={{
            headerTitle: (props) => <></>,
            headerTransparent: true,
          }}
        >
          <Screen name={SignInScreens.Identify} component={IdentifyStep} />
          <Screen name={SignInScreens.Password} component={PasswordStep} />
          <Screen name={SignInScreens.Code} component={CodeStep} />
          <Screen name={SignInScreens.RecoveryPassword} component={CodeStep} />
        </Navigator>
      </NavigationContainer>
    </Animated.View>
  );
});
