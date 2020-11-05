import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { Text, InputMask, Button, Divider } from "@/components/atoms";
import { GButton } from "@/components/google";
import validator from "validator";
import { NextButton, Error } from "../../components";
import { styles } from "../../styles";
import { AuthScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const VerifyScreen = observer<AuthScreenProps>(({ navigation }) => {
  const [phone, setPhone] = useState("");
  const [googleSigInLoading, setGoogleSigInLoading] = useState(false);
  const error = RegisterState.errors.verify;
  const handleSubmit = async () => {
    return navigation.navigate("check");

    if (
      RegisterState.loading ||
      !validator.isMobilePhone(`55${phone}`, "pt-BR")
    )
      return;

    if (await RegisterState.verify(phone)) navigation.navigate("check");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
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
      <Text style={{ textAlign: "center", marginVertical: 10 }}>ou</Text>
      <GButton
        label="Continuar com Google"
        loading={googleSigInLoading}
        style={{ marginVertical: 6 }}
        onPress={async (event) => {
          if (googleSigInLoading) {
            return;
          }

          setGoogleSigInLoading(true);
          // const result = await AuthStore.loginWithGoogle();
          setGoogleSigInLoading(false);
        }}
      />
    </View>
  );
});
