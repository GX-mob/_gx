import React, { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import UI from "@stores/ui";
import { View } from "react-native";

export const AppContainer: FunctionComponent<Partial<View>> = observer(
  (props) => {
    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: UI.theme.colors.background,
        }}
        {...props}
      />
    );
  }
);

export const Justified: FunctionComponent<Partial<View>> = observer((props) => {
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      {...props}
    />
  );
});
