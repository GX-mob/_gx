import React, { useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { observer } from "mobx-react-lite";
import { LoginStore } from "@stores";
import { NextStep } from "@apis/signin";
import { Text, InputMask, Button } from "@components/atoms";
import { SignInButton } from "@components/google";
import { styles } from "./styles";
import { StackScreenProps } from "@react-navigation/stack";

type Props = StackScreenProps<{
  [NextStep.Code]: undefined;
  [NextStep.Password]: undefined;
}>;

const easing = Easing.inOut(Easing.quad);

export const IdentifyStep = observer(({ navigation }: Props) => {
  const [phone, setPhone] = useState("");
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
      <View style={[styles.row, { justifyContent: "flex-end" }]}>
        <Text
          style={{ fontSize: 28, marginBottom: 4, alignSelf: "flex-start" }}
        >
          Entrar
        </Text>
        <Text
          style={{ fontSize: 12, marginBottom: 20, alignSelf: "flex-start" }}
        >
          Digite o DDD + o número do seu celular.
        </Text>
        <View style={{ width: "100%" }}>
          <InputMask
            type="cel-phone"
            style={{ width: "100%" }}
            placeholder="Celular"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(value) => {
              if (value.replace(/\D/g, "").length >= 10) {
                showButton();
              } else {
                hideButton();
              }

              setPhone(value);
            }}
            onSubmitEditing={async (event) => {
              if (LoginStore.loading) {
                return;
              }

              const nextStep = await LoginStore.identify(
                `+55${phone.replace(/\D/g, "")}`,
              );
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
              onPress={async (event) => {
                const nextStep = await LoginStore.identify(
                  `+55${phone.replace(/\D/g, "")}`,
                );

                navigation.navigate(NextStep.Password);
                console.log("signin ot signup");
              }}
            ></Button>
          </Animated.View>
        </View>
      </View>
      <View style={styles.row}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            marginVertical: 20,
            textTransform: "uppercase",
          }}
        >
          ou
        </Text>
        <SignInButton
          onPress={async (event) => {
            navigation.navigate(NextStep.Password);
            return;

            console.log("signin ot signup");
            const result = await LoginStore.loginWithGoogle();
            console.log(result);
          }}
        />
      </View>
      <View style={[styles.row, { height: "20%" }]}>
        <Button
          type="primary"
          style={{ width: "100%", paddingVertical: 10 }}
          onPress={(event) => {
            console.log("open account creation webview");
          }}
        >
          Criar conta
        </Button>
      </View>
    </View>
  );
});
