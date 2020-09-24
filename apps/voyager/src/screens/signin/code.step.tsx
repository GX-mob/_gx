import React, { useState, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { observer } from "mobx-react-lite";
import { LoginStore } from "@stores";
import { Text, Button, InputMask } from "@components/atoms";
import { styles } from "./styles";

const easing = Easing.inOut(Easing.quad);

export const CodeStep = observer(() => {
  const [code, setCode] = useState("");
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const showButton = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing,
    }).start();
  };
  const hideButton = () => {
    Animated.timing(scaleAnim, {
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
          Código
        </Text>
        <Text
          style={{ fontSize: 12, marginBottom: 20, alignSelf: "flex-start" }}
        >
          Enviamos um SMS com o código de confirmação para seu telefone.
        </Text>
        <View style={{ width: "100%" }}>
          <InputMask
            type="custom"
            options={{
              mask: "999-999",
            }}
            autoFocus
            maxLength={7}
            style={{ width: "98%" }}
            value={code}
            keyboardType="phone-pad"
            onChangeText={(value) => {
              const finalValue = value.replace("-", "");
              if (finalValue.length >= 6) {
                showButton();
              } else {
                hideButton();
              }

              setCode(finalValue);
            }}
            onSubmitEditing={async (event) => {
              if (LoginStore.loading) {
                return;
              }
              await LoginStore.password(code);
            }}
          />
          <Animated.View
            style={{
              position: "absolute",
              right: -6,
              bottom: -5,
              transform: [{ scale: scaleAnim }],
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
                if (!(code.length == 6)) {
                  return;
                }
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
          Reenviar
        </Button>
      </View>
    </View>
  );
});
