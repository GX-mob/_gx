import React, { FC } from "react";
import { observer } from "mobx-react-lite";
import LoginStore from "./stores/login";
import LoginScreen from "./screens/login";
import MainScreen from "./screens/main";
import { ActivityIndicator } from "react-native";

import UI from "@stores/ui";

import { Justified } from "./styles";

function App() {
  if (LoginStore.loading) {
    return (
      <Justified>
        <ActivityIndicator
          color={UI.theme.colors.onBackground}
          style={{ width: "100%", height: "100%" }}
        />
      </Justified>
    );
  }

  return LoginStore.token ? <MainScreen /> : <LoginScreen />;
}

export default observer(App);
