import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore, LoginStore } from "@stores";
import { Text, Button, Input, Divider, Avatar } from "@components/atoms";
import { SignInSteps } from "@apis/signin";
import { StackScreenProps } from "@react-navigation/stack";
import { styles, NextButton } from "./common";

type Props = StackScreenProps<{
  [SignInSteps.Code]: undefined;
  RecoveryPassword: undefined;
}>;

export const PasswordStep = observer(({ navigation }: Props) => {
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    navigation.navigate(SignInSteps.Code);
  };

  return (
    <View style={styles.container}>
      <Avatar size={150} uri="https://api.adorable.io/avatars/150/foo.png" />
      <Text style={[styles.subTitle, { marginTop: 12, alignSelf: "center" }]}>
        Fulano
      </Text>
      <View style={{ width: "100%" }}>
        <Input
          editable={!LoginStore.loading}
          secureTextEntry={true}
          style={{ width: "100%" }}
          value={password}
          placeholder="Sua senha"
          textContentType="password"
          onChangeText={(value) => {
            setPassword(value);
          }}
          onSubmitEditing={async () => {
            if (LoginStore.loading) {
              return;
            }
            handleSubmit();
          }}
        />
        <NextButton
          disabled={password.length < 6}
          visible={password.length >= 6}
          onPress={handleSubmit}
        />
      </View>
      <Divider />
      <Button
        type="secondary"
        style={{ width: "100%" }}
        onPress={(event) => {
          UIStore.toggle();
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
