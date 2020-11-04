import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore } from "@/states";
import { Text, InputMask, Button, Divider } from "@/components/atoms";
import { GButton } from "@/components/google";
import validator from "validator";
import LoginState from "../login.state";
import { NextButton, Error } from "../../components";
import { styles } from "../../styles";
import { LoginScreenProps } from "../../interfaces";

export const IdentifyStep = observer<LoginScreenProps>(({ navigation }) => {
  const [phone, setPhone] = useState("");
  const [googleSigInLoading, setGoogleSigInLoading] = useState(false);
  const error = LoginState.errors.id;
  const handleSubmit = async () => {
    if (
      LoginState.loading ||
      !validator.isMobilePhone(LoginState.getFullPhoneNumber(), "pt-BR")
    )
      return;
    const next = await LoginState.identify(phone);
    if (!next) return;

    navigation.navigate(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>
      <Text style={styles.subTitle}>
        Digite o número do seu celular com ddd.
      </Text>
      <View style={{ width: "100%" }}>
        <InputMask
          type="cel-phone"
          style={{ width: "100%" }}
          placeholder="Digite aqui"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(masked, raw) => {
            setPhone(raw || "");
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
      <Text style={{ textAlign: "center", marginVertical: 10 }}>ou</Text>
      <GButton
        label="Entrar com Google"
        loading={googleSigInLoading}
        style={{ marginVertical: 6 }}
        onPress={async (event) => {
          if (googleSigInLoading) {
            return;
          }

          setGoogleSigInLoading(true);
          const result = await LoginState.loginWithGoogle();
          setGoogleSigInLoading(false);
        }}
      />
      <Divider />
      <Button
        type="primary"
        style={{ width: "100%" }}
        onPress={(event) => {
          navigation.navigate("register");
          //UIStore.toggle();
        }}
      >
        Criar conta
      </Button>
    </View>
  );
});
