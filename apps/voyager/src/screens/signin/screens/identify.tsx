import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore, LoginStore } from "@/stores";
import { Text, InputMask, Button, Divider } from "@/components/atoms";
import { SignInButton } from "@/components/google";
import validator from "validator";
import { styles, NextButton, Error, Props } from "../common";

export const IdentifyStep = observer<Props>(({ navigation }) => {
  const [phone, setPhone] = useState("");
  const [googleSigInLoading, setGoogleSigInLoading] = useState(false);
  const error = LoginStore.errors.id;
  const handleSubmit = async () => {
    if (LoginStore.loading || !validator.isMobilePhone(`55${phone}`, "pt-BR"))
      return;
    const next = await LoginStore.identify(phone);
    if (!next) return;

    navigation.navigate(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>
      <Text style={styles.subTitle}>
        Digite o DDD + o número do seu celular.
      </Text>
      <View style={{ width: "100%" }}>
        <InputMask
          type="cel-phone"
          style={{ width: "100%" }}
          placeholder="Digite aqui"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(value) => {
            value = value.replace(/\D/g, "");
            setPhone(value);
          }}
          onSubmitEditing={handleSubmit}
        />
        <NextButton
          visible={validator.isMobilePhone(`55${phone}`, "pt-BR")}
          onPress={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        />
        <Error error={error} />
      </View>
      <SignInButton
        loading={googleSigInLoading}
        style={{ marginVertical: 6 }}
        onPress={async (event) => {
          if (googleSigInLoading) {
            return;
          }

          setGoogleSigInLoading(true);
          const result = await LoginStore.loginWithGoogle();
          setGoogleSigInLoading(false);
        }}
      />
      <Divider />
      <Button
        type="secondary"
        style={{ width: "100%" }}
        onPress={(event) => {
          UIStore.toggle();
        }}
      >
        Criar conta
      </Button>
    </View>
  );
});
