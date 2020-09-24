import "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
enableScreens();

import React from "react";
import { ActivityIndicator } from "react-native";
import { observer } from "mobx-react-lite";
import { LoginStore, UIStore } from "@stores";
import { LoginScreen, MainScreen } from "@screens";

import { Justified } from "./styles";

function App() {
  if (LoginStore.initializing) {
    return (
      <Justified>
        <ActivityIndicator
          color={UIStore.theme.colors.onBackground}
          style={{ width: "100%", height: "100%" }}
        />
      </Justified>
    );
  }

  return LoginStore.token ? <MainScreen /> : <LoginScreen />;
}

export default observer(App);
