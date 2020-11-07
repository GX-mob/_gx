import React from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { Text, Input, Button } from "@/components/atoms";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const PasswordScreen = observer<RegisterScreenProps>(
  ({ navigation }) => {
    const validPassword =
      RegisterState.password.length > 0 && RegisterState.validations.password;

    return (
      <Container>
        <Text style={styles.subTitle}>
          Sabemos que é chato ter que lembrar de senhas, aqui a senha é
          opicional, você pode optar por fazer a autenticação através de códigos
          enviados por SMS.
        </Text>
        <View style={{ width: "100%" }}>
          <Input
            status={
              RegisterState.password.length > 0
                ? !validPassword
                  ? "warn"
                  : "success"
                : "normal"
            }
            placeholder="Senha"
            maxLength={30}
            value={RegisterState.password}
            onChangeText={(value) => {
              RegisterState.setPassword(value);
            }}
          />
          <Alert type="info" visible={true}>
            Precisa ter no minimo 5 caracteres e conter apenas letras, números
            e/ou simbolos.
          </Alert>

          <NextButton
            mode="full"
            visible={true}
            disabled={!validPassword}
            onPress={() => navigation.navigate("docs")}
          >
            Salvar senha
          </NextButton>
          <Button
            type="surface"
            onPress={() => {
              navigation.navigate("docs");
            }}
          >
            Autenticar por SMS
          </Button>
        </View>
      </Container>
    );
  },
);
