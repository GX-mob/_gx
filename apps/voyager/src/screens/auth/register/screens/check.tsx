import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore } from "@/states";
import { Text, Button, Input, Divider } from "@/components/atoms";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const CheckScreen = observer<RegisterScreenProps>(({ navigation }) => {
  const [code, setCode] = useState("");
  const error = RegisterState.errors.check;
  const handleSubmit = async () => {
    return navigation.navigate("cpf");
    if (code.length !== 6) return;
    await RegisterState.check(code);
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
