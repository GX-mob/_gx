import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { LoginStore, UIStore } from "@stores";
import { Text, Button, InputMask, Divider } from "@components/atoms";
import { styles, NextButton } from "./common";

export const CodeStep = observer(() => {
  const [code, setCode] = useState("");

  const handleSubmit = async () => {
    await LoginStore.code(code);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Código</Text>
      <Text style={styles.subTitle}>
        Enviamos um SMS com o código de confirmação para o seu telefone.
      </Text>
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
          onSubmitEditing={handleSubmit}
        />
        <NextButton
          disabled={code.length !== 6}
          visible={code.length === 6}
          onPress={handleSubmit}
        />
      </View>
      <Divider />
      <Button
        disabled={LoginStore.resendSecondsLeft > 0}
        type="secondary"
        style={{ width: "100%" }}
        onPress={() => {
          UIStore.toggle();
        }}
        textStyle={{
          fontSize: 12,
          fontWeight: "bold",
          textTransform: "uppercase",
        }}
      >
        Reenviar
        {LoginStore.resendSecondsLeft > 0
          ? ` - ${LoginStore.resendSecondsLeft}`
          : ""}
      </Button>
    </View>
  );
});
