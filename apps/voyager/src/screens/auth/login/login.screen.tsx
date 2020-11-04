import React, { memo } from "react";
import { View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { IdentifyStep } from "./screens/identify";
import { PasswordStep } from "./screens/password";
import { CodeStep } from "./screens/code";
import { LoginScreens } from "../interfaces";

const { Navigator, Screen } = createStackNavigator<Record<LoginScreens, any>>();

export const LoginScreen = memo(() => {
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <Navigator
        screenOptions={{
          headerTitle: (props) => <></>,
          headerTransparent: true,
        }}
      >
        <Screen name="identify" component={IdentifyStep} />
        <Screen name="password" component={PasswordStep} />
        <Screen name="code" component={CodeStep} />
      </Navigator>
    </View>
  );
});
