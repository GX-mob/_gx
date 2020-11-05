import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore } from "@/states";
import { Button, Input, Divider } from "@/components/atoms";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { LoginScreenProps } from "../../interfaces";
import LoginState from "../login.state";

export const PasswordStep = observer<LoginScreenProps>(({ navigation }) => {
  const [password, setPassword] = useState("");

  const error = LoginState.errors.credential;

  const handleSubmit = async () => {
    if (password.length < 6) return;
    const next = await LoginState.password(password);
    if (!next) return;

    navigation.navigate(next);
  };

  return (
    <Container>
      <View style={{ width: "100%" }}>
        <Input
          editable={!LoginState.loading}
          status={error ? "error" : undefined}
          secureTextEntry={true}
          value={password}
          placeholder="Sua senha"
          textContentType="password"
          onChangeText={(value) => {
            LoginState.errors.credential = "";
            setPassword(value);
          }}
          onSubmitEditing={handleSubmit}
        />
        <NextButton
          mode="attached"
          visible={password.length >= 6}
          onPress={handleSubmit}
        />
        <Alert type="error" visible={!!error}>
          {error}
        </Alert>
      </View>
      <Divider />
      <Button
        type="secondary"
        style={{ width: "100%" }}
        onPress={() => {
          UIStore.toggle();
          //navigation.navigate(SignInScreens.RecoveryPassword);
        }}
        textStyle={{
          fontSize: 12,
          fontWeight: "bold",
          textTransform: "uppercase",
        }}
      >
        Esqueci minha senha
      </Button>
    </Container>
  );
});
