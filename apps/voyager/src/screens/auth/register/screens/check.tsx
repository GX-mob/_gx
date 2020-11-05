import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore } from "@/states";
import { Text, Button, InputMask, Divider } from "@/components/atoms";
import { NextButton, Error } from "../../components";
import { styles } from "../../styles";
import RegisterState from "../register.state";

export const CheckStep = observer(() => {
  const [code, setCode] = useState("");
  const error = RegisterState.errors.check;
  const handleSubmit = async () => {
    if (code.length !== 6) return;
    await RegisterState.check(code);
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
        <NextButton visible={code.length === 6} onPress={handleSubmit} />
        <Error error={error} />
      </View>
      <Divider />
      <Button
        disabled={RegisterState.resendSecondsLeft > 0}
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
        {RegisterState.resendSecondsLeft > 0
          ? ` - ${RegisterState.resendSecondsLeft}`
          : ""}
      </Button>
    </View>
  );
});
