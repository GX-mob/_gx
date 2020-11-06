import React from "react";
import { View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { RegisterScreens } from "../interfaces";
import { VerifyScreen } from "./screens/verify";
import { CheckScreen } from "./screens/check";
import { CPFStep } from "./screens/cpf";
import { ProfileStep } from "./screens/profile";
import { PasswordScreen } from "./screens/password";
import { DocsScreen } from "./screens/docs";
import { FinishScreen } from "./screens/finish";

const { Navigator, Screen } = createStackNavigator<
  Record<RegisterScreens, any>
>();

export function RegisterScreen() {
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
        initialRouteName="profile"
      >
        <Screen name="verify" component={VerifyScreen} />
        <Screen name="check" component={CheckScreen} />
        <Screen name="cpf" component={CPFStep} />
        <Screen name="profile" component={ProfileStep} />
        <Screen name="password" component={PasswordScreen} />
        <Screen name="docs" component={DocsScreen} />
        <Screen name="finish" component={FinishScreen} />
      </Navigator>
    </View>
  );
}
