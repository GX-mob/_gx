import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore, LoginStore } from "@stores";
import { NextStep } from "@apis/signin";
import { Text, InputMask, Button, Divider } from "@components/atoms";
import { SignInButton } from "@components/google";
import { StackScreenProps } from "@react-navigation/stack";
import validator from "validator";
import { styles, NextButton } from "./common";

type Props = StackScreenProps<{
  [NextStep.Code]: undefined;
  [NextStep.Password]: undefined;
}>;

export const IdentifyStep = observer<Props>(({ navigation }) => {
  const [phone, setPhone] = useState("");

  const handleSubmit = async () => {
    navigation.navigate(NextStep.Password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>
      <Text style={styles.subTitle}>
        Digite o DDD + o número do seu celular.
      </Text>
      <View style={{ width: "100%" }}>
        <InputMask
          type="cel-phone"
          style={{ width: "100%" }}
          placeholder="Digite aqui"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(value) => {
            value = value.replace(/\D/g, "");
            setPhone(value);
          }}
          onSubmitEditing={handleSubmit}
        />
        <NextButton
          disabled={
            LoginStore.loading ||
            !validator.isMobilePhone(`55${phone}`, "pt-BR")
          }
          visible={validator.isMobilePhone(`55${phone}`, "pt-BR")}
          onPress={handleSubmit}
        />
      </View>
      <Divider />
      <SignInButton
        style={{ marginVertical: 6 }}
        onPress={async (event) => {
          const result = await LoginStore.loginWithGoogle();
          console.log(result);
        }}
      />
      <Button
        type="primary"
        style={{ width: "100%", paddingVertical: 10 }}
        onPress={(event) => {
          UIStore.toggle();
        }}
      >
        Criar conta
      </Button>
    </View>
  );
});
