import React from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { Text, Input } from "@/components/atoms";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const CPFStep = observer<RegisterScreenProps>(({ navigation }) => {
  let cpfInputRef: any;
  let birthInputRef: any;
  const { cpf: cpfError, birth: birthError } = RegisterState.errors;
  const { cpf: validCPF, birth: validBirth } = RegisterState.validations;

  const handleSubmit = async (e: any) => {
    const [validCPF, validBirth] = RegisterState.isValidCPFAndBirth();

    if (validCPF && validBirth) {
      return navigation.navigate("profile");
    }

    if (validCPF && !validBirth) {
      return birthInputRef.focus();
    }

    if (validBirth && !validCPF) {
      return cpfInputRef.focus();
    }

    return navigation.navigate("profile");
  };

  return (
    <Container>
      <Text style={styles.title}>CPF</Text>
      <Text style={styles.subTitle}>
        Usado apenas para confirmação de identidade, visando aumentar a
        segurança da plataforma.
      </Text>
      <View style={{ width: "100%" }}>
        <Input
          status={
            !!RegisterState.errors.cpf
              ? "error"
              : validCPF
              ? "success"
              : "normal"
          }
          refInput={(ref) => {
            if (ref) cpfInputRef = ref;
          }}
          type="custom"
          options={{
            mask: "999.999.999-99",
          }}
          placeholder="CPF"
          maxLength={14}
          value={RegisterState.cpf}
          keyboardType="phone-pad"
          onChangeText={(value) => {
            value = value.replace(/[.-]/g, "");
            const validated = RegisterState.setCpf(value);

            if (!validated) return;

            const [validBirth] = RegisterState.isValidBirth(
              RegisterState.birth,
            );

            if (!validBirth) birthInputRef.focus();
            else cpfInputRef.blur();
          }}
          onSubmitEditing={handleSubmit}
        />
        <Alert type="warn" visible={!!cpfError}>
          {cpfError}
        </Alert>
      </View>
      <View style={{ width: "100%" }}>
        <Input
          status={
            !!RegisterState.errors.birth
              ? "error"
              : validBirth
              ? "success"
              : "normal"
          }
          refInput={(ref) => {
            if (ref) birthInputRef = ref;
          }}
          type="custom"
          options={{
            mask: "99/99/9999",
          }}
          placeholder="Data de nascimento"
          maxLength={10}
          value={RegisterState.birth}
          keyboardType="phone-pad"
          onChangeText={(value) => {
            const validated = RegisterState.setBirth(value);

            if (!validated) return;

            const validCPF = RegisterState.isValidCPF(RegisterState.cpf);

            if (!validCPF) cpfInputRef.focus();
            else birthInputRef.blur();
          }}
          onSubmitEditing={handleSubmit}
        />

        <Alert type="warn" visible={!!birthError}>
          {birthError}
        </Alert>
      </View>
      <NextButton mode="full" visible={validCPF && validBirth}>
        Próximo
      </NextButton>
    </Container>
  );
});
