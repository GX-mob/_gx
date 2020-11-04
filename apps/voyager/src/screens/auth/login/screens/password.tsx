import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore, AuthStore } from "@/states";
import { Button, Input, Divider } from "@/components/atoms";
import { NextButton, Error } from "../../components";
import { styles } from "../../styles";
import { LoginScreenProps } from "../../interfaces";

export const PasswordStep = observer<LoginScreenProps>(({ navigation }) => {
  const [password, setPassword] = useState("");

  const error = AuthStore.errors.credential;

  const handleSubmit = async () => {
    if (password.length < 6) return;
    const next = await AuthStore.password(password);
    if (!next) return;

    navigation.navigate(next);
  };

  return (
    <View style={styles.container}>
      <View style={{ width: "100%" }}>
        <Input
          editable={!AuthStore.loading}
          status={error ? "error" : undefined}
          secureTextEntry={true}
          style={{ width: "100%" }}
          value={password}
          placeholder="Sua senha"
          textContentType="password"
          onChangeText={(value) => {
            AuthStore.errors.credential = "";
            setPassword(value);
          }}
          onSubmitEditing={handleSubmit}
        />
        <NextButton visible={password.length >= 6} onPress={handleSubmit} />
        <Error error={error} />
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
    </View>
  );
});
