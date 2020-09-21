import React, { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import { UIStore } from "@stores";
import { View } from "react-native";

export const AppContainer: FunctionComponent<Partial<View>> = observer(
  (props) => {
    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: UIStore.theme.colors.background,
        }}
        {...props}
      />
    );
  },
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
