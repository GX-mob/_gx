import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore } from "@/states";
import { Text, Button, Input, Divider } from "@/components/atoms";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const CodeScreen = observer<RegisterScreenProps>(({ navigation }) => {
  const [code, setCode] = useState("");
  const error = RegisterState.errors.code;
  const validated = RegisterState.validations.code;
  const handleSubmit = () => {
    RegisterState.checkContactVerification(code);
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
            value = value.replace("-", "");
            setCode(value);
            RegisterState.validateCode(value);
          }}
          onSubmitEditing={handleSubmit}
        />
        <NextButton
          mode="attached"
          onPress={handleSubmit}
          visible={validated}
          disabled={RegisterState.loading}
          loading={RegisterState.loading}
        />
        <Alert visible={!!error} type="error">
          {error}
        </Alert>
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
    </Container>
  );
});
