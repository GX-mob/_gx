import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore } from "@/states";
import { Text, Button, Input, Divider } from "@/components/atoms";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import LoginState from "../login.state";

export const CodeStep = observer(() => {
  const [code, setCode] = useState("");
  const error = LoginState.errors.code;
  const handleSubmit = async () => {
    if (code.length !== 6) return;
    await LoginState.code(code);
  };

  return (
    <Container>
      <Text style={styles.title}>Código</Text>
      <Text style={styles.subTitle}>
        Enviamos um SMS com o código de confirmação para o seu telefone.
      </Text>
      <View style={{ width: "100%" }}>
        <Input
          type="custom"
          options={{
            mask: "999-999",
          }}
          placeholder="Digite aqui"
          maxLength={7}
          value={code}
          keyboardType="phone-pad"
          onChangeText={(value) => {
            setCode(value.replace("-", ""));
          }}
          onSubmitEditing={handleSubmit}
        />
        <NextButton
          mode="attached"
          visible={code.length === 6}
          onPress={handleSubmit}
        />
        <Alert visible={!!error} type="error">
          {error}
        </Alert>
      </View>
      <Divider />
      <Button
        disabled={LoginState.resendSecondsLeft > 0}
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
        {LoginState.resendSecondsLeft > 0
          ? ` - ${LoginState.resendSecondsLeft}`
          : ""}
      </Button>
    </Container>
  );
});
