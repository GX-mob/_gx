import React, { useState, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { observer } from "mobx-react-lite";
import { LoginStore } from "@stores";
import { Text, Button, Input } from "@components/atoms";
import { styles } from "./styles";
import { NextStep } from "@apis/signin";
import { StackScreenProps } from "@react-navigation/stack";

type Props = StackScreenProps<{
  [NextStep.Code]: undefined;
  RecoveryPassword: undefined;
}>;

const easing = Easing.inOut(Easing.quad);

export const PasswordStep = observer(({ navigation }: Props) => {
  const [password, setPassword] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showButton = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing,
    }).start();
  };
  const hideButton = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.row, { height: "60%", justifyContent: "center" }]}>
        <Text
          style={{ fontSize: 28, marginBottom: 4, alignSelf: "flex-start" }}
        >
          Senha
        </Text>
        <View style={{ width: "100%" }}>
          <Input
            autoFocus
            secureTextEntry={true}
            style={{ width: "100%" }}
            value={password}
            textContentType="password"
            onChangeText={(value) => {
              if (value.length >= 6) {
                showButton();
              } else {
                hideButton();
              }

              setPassword(value);
            }}
            onSubmitEditing={async (event) => {
              if (LoginStore.loading) {
                return;
              }
              await LoginStore.password(password);
            }}
          />
          <Animated.View
            style={{
              position: "absolute",
              right: -6,
              bottom: -5,
              transform: [{ scale: fadeAnim }],
            }}
          >
            <Button
              type="primary"
              style={{
                width: 50,
                height: 50,
                borderRadius: 100,
              }}
              onPress={(event) => {
                if (!(password.length >= 6)) {
                  return;
                }

                navigation.navigate(NextStep.Code);
                console.log("signin ot signup");
              }}
            ></Button>
          </Animated.View>
        </View>
      </View>
      <View style={[styles.row, { height: "20%" }]}>
        <Button
          type="surface"
          style={{ width: "100%", paddingVertical: 8 }}
          onPress={(event) => {
            console.log("open account creation webview");
          }}
        >
          Esqueci minha senha
        </Button>
      </View>
    </View>
  );
});
