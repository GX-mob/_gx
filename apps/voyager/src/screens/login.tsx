// TODO
import React, { useState, FC } from "react";
import { StyleSheet, View, Text as RCText, TextProps } from "react-native";
import UI from "@stores/ui";
import Login from "@stores/login";
import Logo from "@components/logo";
import { InputMask, Button } from "@components/atoms";
import { observer } from "mobx-react-lite";

import { SignInButton } from "@components/google";

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    height: "100%",
    alignItems: "center",
  },
  row: {
    width: "80%",
    height: "40%",
    alignItems: "center",
    flexDirection: "column",
  },
});

const Text = observer<TextProps>(({ style, ...props }) => (
  <RCText
    style={{
      color: UI.theme.colors.onBackground,
      ...((style as object) || {}),
    }}
    {...props}
  />
));

const LoginScreen: FC = () => {
  const [phone, setPhone] = useState("");

  return (
    <View style={styles.container}>
      <View style={[styles.row, { height: "20%" }]}>
        <Logo style={{ marginTop: 60 }} />
      </View>
      <View style={[styles.row, { justifyContent: "flex-end" }]}>
        <Text
          style={{ fontSize: 28, marginBottom: 4, alignSelf: "flex-start" }}
        >
          Entrar
        </Text>
        <Text
          style={{ fontSize: 12, marginBottom: 20, alignSelf: "flex-start" }}
        >
          Não se preocupe, criaremos uma conta caso você não tenha uma.
        </Text>
        <InputMask
          type="cel-phone"
          style={{ width: "98%" }}
          placeholder="Celular"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
          }}
          onSubmitEditing={async (event) => {
            console.log("why 2");
            console.log(
              "login",
              await Login.identify(`+55${phone.replace(/\D/g, "")}`),
            );
          }}
        />
        <Button
          type="surface"
          style={{ width: "98%", height: 0, opacity: 0, marginTop: 4 }}
          onPress={(event) => {
            console.log("signin ot signup");
          }}
        >
          Entrar
        </Button>
      </View>
      <View style={styles.row}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            marginBottom: 20,
            textTransform: "uppercase",
          }}
        >
          ou
        </Text>
        <SignInButton
          onPress={async (event) => {
            console.log("signin ot signup");
            const result = await Login.loginWithGoogle();
            console.log(result);
          }}
        />

        {/*
        <Button
          type="surface"
          style={{ width: "100%", paddingVertical: 6 }}
          onPress={(event) => {
            console.log("signin ot signup");
          }}
        >
          Esqueci minha senha
        </Button> */}
      </View>
    </View>
  );
};

export default observer(LoginScreen);
