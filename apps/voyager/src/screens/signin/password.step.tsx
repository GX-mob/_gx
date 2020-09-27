import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore, LoginStore } from "@stores";
import { Button, Input } from "@components/atoms";
import { NextStep } from "@apis/signin";
import { StackScreenProps } from "@react-navigation/stack";
import { Step, NextButton } from "./components";

type Props = StackScreenProps<{
  [NextStep.Code]: undefined;
  RecoveryPassword: undefined;
}>;

export const PasswordStep = observer(({ navigation }: Props) => {
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    navigation.navigate(NextStep.Code);
  };

  const Bottom = () => (
    <>
      <Button
        type="secondary"
        style={{ width: "100%" }}
        onPress={(event) => {
          UIStore.toggle();
        }}
      >
        ESQUECI MINHA SENHA
      </Button>
    </>
  );

  return (
    <Step subTitle="Digite sua senha" Bottom={Bottom}>
      <View style={{ width: "100%" }}>
        <Input
          editable={!LoginStore.loading}
          secureTextEntry={true}
          style={{ width: "100%" }}
          value={password}
          placeholder="Digite aqui"
          textContentType="password"
          onChangeText={(value) => {
            setPassword(value);
          }}
          onSubmitEditing={async () => {
            if (LoginStore.loading) {
              return;
            }
            handleSubmit();
          }}
        />
        <NextButton
          disabled={password.length < 6}
          visible={password.length >= 6}
          onPress={handleSubmit}
        />
      </View>
    </Step>
  );
});
