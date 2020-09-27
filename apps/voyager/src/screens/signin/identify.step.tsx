import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore, LoginStore } from "@stores";
import { NextStep } from "@apis/signin";
import { InputMask, Button } from "@components/atoms";
import { SignInButton } from "@components/google";
import { StackScreenProps } from "@react-navigation/stack";
import { Step, NextButton } from "./components";
import validator from "validator";

type Props = StackScreenProps<{
  [NextStep.Code]: undefined;
  [NextStep.Password]: undefined;
}>;

export const IdentifyStep = observer<Props>(({ navigation }) => {
  const [phone, setPhone] = useState("");

  const handleSubmit = async () => {
    navigation.navigate(NextStep.Password);
  };

  const Bottom = () => (
    <>
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
    </>
  );

  return (
    <Step
      title="Entrar"
      subTitle="Digite o DDD + o número do seu celular."
      Bottom={Bottom}
    >
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
    </Step>
  );
});
