import React from "react";
import { View, Text } from "react-native";
import { observer } from "mobx-react-lite";

export const MainScreen = observer(() => {
  return (
    <View style={{ width: "100%", height: "100%", backgroundColor: "blue" }}>
      <Text>Main</Text>
    </View>
  );
});
