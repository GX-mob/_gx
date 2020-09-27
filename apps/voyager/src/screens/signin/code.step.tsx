import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { LoginStore } from "@stores";
import { Button, InputMask } from "@components/atoms";
import { Step, NextButton } from "./components";

export const CodeStep = observer(() => {
  const [code, setCode] = useState("");

  const handleSubmit = async () => {
    await LoginStore.password(code);
  };

  const Bottom = () => (
    <Button
      type="secondary"
      disabled={true}
      style={{ width: "100%", paddingVertical: 8 }}
      onPress={(event) => {
        console.log("open account creation webview");
      }}
    >
      Reenviar
    </Button>
  );

  return (
    <Step
      title="Código"
      subTitle="Enviamos um SMS com o código de confirmação para seu telefone."
      Bottom={Bottom}
    >
      <View style={{ width: "100%" }}>
        <InputMask
          type="custom"
          options={{
            mask: "999-999",
          }}
          placeholder="Digite aqui"
          maxLength={7}
          style={{ width: "100%" }}
          value={code}
          keyboardType="phone-pad"
          onChangeText={(value) => {
            setCode(value.replace("-", ""));
          }}
          onSubmitEditing={async (event) => {
            if (LoginStore.loading) {
              return;
            }
          }}
        />
        <NextButton
          disabled={code.length !== 6}
          visible={code.length === 6}
          onPress={handleSubmit}
        />
      </View>
    </Step>
  );
});
