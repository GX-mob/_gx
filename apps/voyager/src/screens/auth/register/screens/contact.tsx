import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { Text, Input } from "@/components/atoms";
import { GButton } from "@/components/google";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const ContactScreen = observer<RegisterScreenProps>(({ navigation }) => {
  const [phone, setPhone] = useState("");
  const [googleSigInLoading, setGoogleSigInLoading] = useState(false);
  const error = RegisterState.errors.contact;
  const validated = RegisterState.validations.contact;
  const handleSubmit = async () => {
    RegisterState.verify(phone);
  };

  return (
    <Container>
      <Text style={styles.title}>Criar conta</Text>
      <View style={{ width: "100%", marginTop: 16 }}>
        <Input
          type="cel-phone"
          placeholder="Celular com ddd"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(value) => {
            value = value.replace(/\D/g, "");
            setPhone(value);
            RegisterState.validateContact(value);
          }}
          onSubmitEditing={handleSubmit}
        />
        <NextButton
          mode="attached"
          visible={validated}
          loading={RegisterState.loading}
          disabled={!validated || RegisterState.loading}
          onPress={handleSubmit}
        />
        <Alert visible={!!error} type="error">
          {error}
        </Alert>
      </View>
      <Text style={{ textAlign: "center", marginVertical: 10 }}>ou</Text>
      <GButton
        disabled={RegisterState.loading}
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
    </Container>
  );
});
