import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore, LoginStore } from "@stores";
import { Text, Button, Input, Divider, Avatar } from "@components/atoms";
import { styles, NextButton, Props, Error, SignInScreens } from "./common";

export const PasswordStep = observer<Props>(({ navigation }) => {
  const [password, setPassword] = useState("");

  const error = LoginStore.errors.credential;

  const handleSubmit = async () => {
    const next = await LoginStore.password(password);
    if (!next) return;

    navigation.navigate(next);
  };

  return (
    <View style={styles.container}>
      <Avatar
        size={150}
        uri={
          LoginStore.profile?.avatar ||
          `https://api.adorable.io/avatars/150/${LoginStore.phone}.png`
        }
      />
      <Text style={[styles.subTitle, { marginTop: 12, alignSelf: "center" }]}>
        {LoginStore.profile?.firstName}
      </Text>
      <View style={{ width: "100%" }}>
        <Input
          editable={!LoginStore.loading}
          status={error ? "error" : undefined}
          secureTextEntry={true}
          style={{ width: "100%" }}
          value={password}
          placeholder="Sua senha"
          textContentType="password"
          onChangeText={(value) => {
            setPassword(value);
          }}
          onSubmitEditing={handleSubmit}
        />
        <NextButton
          disabled={password.length < 6}
          visible={password.length >= 6}
          onPress={handleSubmit}
        />
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
