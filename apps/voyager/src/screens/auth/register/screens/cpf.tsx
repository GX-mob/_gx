import React, { useState, useRef } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore } from "@/states";
import { Text, Button, InputMask, Divider } from "@/components/atoms";
import { NextButton, Error } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const CPFStep = observer<RegisterScreenProps>(({ navigation }) => {
  let cpfInputRef: any;
  let birthInputRef: any;
  const { cpf: cpfError, birth: birthError } = RegisterState.errors;
  const { cpf: validCPF, birth: validBirth } = RegisterState.validations;
  console.log(validCPF, validBirth);
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
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CPF</Text>
      <Text style={styles.subTitle}>
        Usado apenas para confirmação de identidade, visando aumentar a
        segurança da plataforma.
      </Text>
      <View style={{ width: "100%" }}>
        <InputMask
          error={!!RegisterState.errors.cpf}
          refInput={(ref) => {
            if (ref) cpfInputRef = ref;
          }}
          type="custom"
          options={{
            mask: "999.999.999-99",
          }}
          placeholder="Digite o CPF aqui"
          maxLength={14}
          style={{ width: "100%" }}
          value={RegisterState.cpf}
          keyboardType="phone-pad"
          onChangeText={(value) => {
            const validated = RegisterState.setCpf(value.replace(/[.-]/g, ""));

            if (validated) {
              const validBirth = RegisterState.validateBirth(false);

              if (!validBirth) birthInputRef.focus();
              else cpfInputRef.blur();
            }
          }}
          onSubmitEditing={handleSubmit}
        />
        <Error error={cpfError} />
      </View>
      <View style={{ width: "100%" }}>
        <InputMask
          error={!!RegisterState.errors.birth}
          refInput={(ref) => {
            if (ref) birthInputRef = ref;
          }}
          type="custom"
          options={{
            mask: "99/99/9999",
          }}
          placeholder="Data de nascimento"
          maxLength={10}
          style={{ width: "100%" }}
          value={RegisterState.birth}
          keyboardType="phone-pad"
          onChangeText={(value) => {
            const validated = RegisterState.setBirth(value);

            if (validated) {
              const validCPF = RegisterState.validateCPF(false);

              if (!validCPF) cpfInputRef.focus();
              else birthInputRef.blur();
            }
          }}
          onSubmitEditing={handleSubmit}
        />
        <Error error={birthError} />
      </View>
      {validCPF && validBirth ? <Button type="primary">next</Button> : null}
    </View>
  );
});
