import React from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { createStackNavigator } from "@react-navigation/stack";
import { Snackbar } from "react-native-paper";
import { RegisterScreens } from "../interfaces";
import { TermsScreen } from "./screens/terms";
import { ContactScreen } from "./screens/contact";
import { CodeScreen } from "./screens/code";
import { CPFScreen } from "./screens/cpf";
import { ProfileStep } from "./screens/profile";
import { PasswordScreen } from "./screens/password";
import { FinishScreen } from "./screens/finish";
import RegisterState from "./register.state";

const { Navigator, Screen } = createStackNavigator<
  Record<RegisterScreens, any>
>();

export const RegisterScreen = observer(() => (
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
      initialRouteName="terms"
    >
      <Screen name="terms" component={TermsScreen} />
      <Screen name="contact" component={ContactScreen} />
      <Screen name="code" component={CodeScreen} />
      <Screen name="cpf" component={CPFScreen} />
      <Screen name="profile" component={ProfileStep} />
      <Screen name="password" component={PasswordScreen} />
      <Screen name="finish" component={FinishScreen} />
    </Navigator>
    <Snackbar onDismiss={() => {}} visible={RegisterState.snackVisible}>
      {RegisterState.snackContent}
    </Snackbar>
  </View>
));
