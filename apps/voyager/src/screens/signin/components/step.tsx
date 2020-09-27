import React, { ComponentType } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { NextStep } from "@apis/signin";
import { Text, Divider } from "@components/atoms";
import { styles } from "../styles";
import { StackScreenProps } from "@react-navigation/stack";

export type Props = StackScreenProps<{
  [NextStep.Code]: undefined;
  [NextStep.Password]: undefined;
}>;

export const Step = observer<{
  title?: string;
  subTitle?: string;
  Bottom?: ComponentType;
}>(({ title, subTitle, Bottom, children }) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.row,
          { height: "100%", justifyContent: "flex-end", paddingBottom: 12 },
        ]}
      >
        <Text
          style={{
            fontSize: 16,
            marginBottom: 4,
            fontWeight: "bold",
            alignSelf: "flex-start",
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
        {subTitle && (
          <Text
            style={{
              fontSize: 20,
              fontWeight: "100",
              marginBottom: 20,
              alignSelf: "flex-start",
            }}
          >
            {subTitle}
          </Text>
        )}
        {children}
        {Bottom && (
          <>
            <Divider />
            <Bottom />
          </>
        )}
      </View>
    </View>
  );
});
