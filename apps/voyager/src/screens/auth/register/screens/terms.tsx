import React from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { Text } from "@/components/atoms";
import { Container, NextButton } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const TermsScreen = observer<RegisterScreenProps>(({ navigation }) => {
  return (
    <Container>
      <Text style={styles.title}>Termos</Text>
      <Text style={styles.subTitle}>
        Você precisa estar de acordo com os termos abaixo para pode prosseguir
        com o cadastro.
      </Text>
      <View style={{ width: "100%" }}>
        <Text style={styles.paragraph}>Foo</Text>
      </View>
      <NextButton
        mode="full"
        visible
        onPress={() => {
          RegisterState.acceptTerms();
        }}
      >
        Eu aceito
      </NextButton>
    </Container>
  );
});
