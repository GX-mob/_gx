import React from "react";
import { observer } from "mobx-react-lite";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { UIStore } from "@stores";
import Logo from "@components/logo";
import { NextStep } from "@apis/signin";
import { IdentifyStep } from "./identify.step";
import { PasswordStep } from "./password.step";
import { CodeStep } from "./code.step";

const Stack = createStackNavigator();

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

  //const theme = UIStore.theme.name;

  return (
    <>
      <Logo style={{ alignSelf: "center", top: 33, zIndex: 99 }} />
      <NavigationContainer theme={navigatorTheme}>
        <Stack.Navigator>
          <Stack.Screen
            name="Identify"
            component={IdentifyStep}
            options={{
              headerTitle: (props) => <></>,
            }}
          />
          <Stack.Screen
            name={NextStep.Password}
            options={{
              headerTitle: (props) => <></>,
            }}
            component={PasswordStep}
          />
          <Stack.Screen
            name={NextStep.Code}
            options={{
              headerTitle: (props) => <></>,
            }}
            component={CodeStep}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
});
