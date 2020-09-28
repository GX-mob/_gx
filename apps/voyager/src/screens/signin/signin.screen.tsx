import React from "react";
import { observer } from "mobx-react-lite";
import { Dimensions } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { UIStore } from "@stores";
import Logo from "@components/logo";
import { Lines } from "@components/general";
import { SignInSteps } from "@apis/signin";
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

  return (
    <>
      <Logo style={{ alignSelf: "center", top: 33, zIndex: 99 }} />
      <Lines width={windowWidth} />
      <NavigationContainer theme={navigatorTheme}>
        <Navigator
          screenOptions={{
            headerTitle: (props) => <></>,
            headerTransparent: true,
          }}
        >
          <Screen name="Identify" component={IdentifyStep} />
          <Screen name={SignInSteps.Password} component={PasswordStep} />
          <Screen name={SignInSteps.Code} component={CodeStep} />
          <Screen name="RecoveryPassword" component={CodeStep} />
        </Navigator>
      </NavigationContainer>
    </>
  );
});
