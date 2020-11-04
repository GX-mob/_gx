import React from "react";
import { View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { Text } from "@/components/atoms";
import { RegisterScreens } from "../interfaces";
import { VerifyScreen } from "./screens/verify";

const { Navigator, Screen } = createStackNavigator<
  Record<RegisterScreens, any>
>();

const A = () => <Text>A</Text>;
const B = () => <Text>B</Text>;

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
      >
        <Screen name="verify" component={VerifyScreen} />
        <Screen name="check" component={B} />
        <Screen name="cpf" component={B} />
        <Screen name="profile" component={B} />
        <Screen name="password" component={B} />
        <Screen name="docs" component={B} />
        <Screen name="finish" component={B} />
      </Navigator>
    </View>
  );
}
