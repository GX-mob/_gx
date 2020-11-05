import React, { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { Text, Input } from "@/components/atoms";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const ProfileStep = observer<RegisterScreenProps>(({ navigation }) => {
  const [name, setName] = useState("");

  return (
    <Container>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subTitle}>Escolha uma foto e digite seu nome</Text>
      <View
        style={{
          width: 130,
          height: 130,
          borderRadius: 130,
          backgroundColor: "blue",
          marginVertical: 20,
        }}
      />
      <View style={{ width: "100%" }}>
        <Input
          status={"normal"}
          value={name}
          placeholder="Nome e sobrenome"
          maxLength={30}
          onChangeText={(value) => {
            setName(value);
            RegisterState.setName(value.trim());
          }}
        />
        <Alert type="warn" visible={!!RegisterState.errors.name}>
          {RegisterState.errors.name}
        </Alert>
      </View>
      <NextButton mode="full" visible={RegisterState.validations.name}>
        Próximo
      </NextButton>
    </Container>
  );
});
