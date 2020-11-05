import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { observer } from "mobx-react-lite";
import { UIStore } from "@/states";
import { Text, Input, Button, Divider } from "@/components/atoms";
import { GButton } from "@/components/google";
import validator from "validator";
import LoginState from "../login.state";
import { Container, NextButton, Alert } from "../../components";
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
    <Container>
      <Text style={styles.title}>Entrar</Text>
      <View style={{ width: "100%" }}>
        <Input
          type="cel-phone"
          placeholder="Celular"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(masked, raw) => {
            setPhone(raw || "");
          }}
          onSubmitEditing={handleSubmit}
        />
        <NextButton
          mode="attached"
          visible={validator.isMobilePhone(`55${phone}`, "pt-BR")}
          onPress={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        />

        <Alert type="error" visible={!!error}>
          {error}
        </Alert>
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
    </Container>
  );
});
