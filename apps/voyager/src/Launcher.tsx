import React from "react";
import { registerRootComponent } from "expo";
import { View, ScrollView } from "react-native";
import { observer } from "mobx-react-lite";
import { Provider as PaperProvider } from "react-native-paper";

import { Dimensions } from "react-native";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

import App from "./App";
import { UIStore } from "./states";

const height = Dimensions.get("window").height;

function Launcher() {
  return (
    <PaperProvider>
      <View
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: UIStore.theme.colors.background,
        }}
      >
        <LinearGradient
          colors={[UIStore.theme.colors.background, "transparent"]}
          style={{
            position: "relative",
            zIndex: 99999,
            top: 0,
            width: "100%",
            height: Constants.statusBarHeight + Constants.statusBarHeight / 2,
          }}
        ></LinearGradient>
        <View
          style={{
            position: "relative",
            zIndex: 9999,
            width: "100%",
            height: "100%",
            top: -(Constants.statusBarHeight + Constants.statusBarHeight / 2),
          }}
        >
          <ScrollView>
            <View
              style={{
                width: "100%",
                height,
              }}
            >
              <App />
            </View>
          </ScrollView>
          <StatusBar style={UIStore.theme.statusBarStyle} />
        </View>
      </View>
    </PaperProvider>
  );
}

export default registerRootComponent(observer(Launcher));
