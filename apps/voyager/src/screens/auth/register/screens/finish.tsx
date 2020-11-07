import React from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { LinearGradient } from "expo-linear-gradient";
import { Text, Input } from "@/components/atoms";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const FinishScreen = observer<RegisterScreenProps>(({ navigation }) => {
  return (
    <Container>
      <Text style={styles.title}>Obrigado!</Text>
      <Text style={styles.paragraph}>
        É uma honra te-lo conosco, abaixo algumas regras e informções
        importantes sobre como funcionamos.
      </Text>

      <Text style={[styles.subTitle]}>Modo de operação</Text>
      <Text style={styles.paragraph}>
        Operamos de um jeito diferente, uma forma mais justa, que foi pensada
        para aumentar seus lucros e consequentemente aumentar a qualidade dos
        seus serviços.
      </Text>

      <Text style={styles.paragraph}>
        Cobramos por mensalidade, você a paga e os frutos do seu trabalho é seu,
        apenas taxas sobre pagamentos de corridas com cartão de crédito são
        repassadas, nosso modo de operar não nos permite arcar com esses custos.
      </Text>

      <Text style={styles.paragraph}>O valor da mensalidade é:</Text>
      <Text style={{ fontSize: 30, marginVertical: 10 }}>R$ XX,00</Text>
      <Text style={styles.paragraph}>
        E o valor da taxa do cartão é sobre o valor da corrida: 3,99% + R$ 0,50;
      </Text>
      <Text style={styles.paragraph}>
        Em uma corrida no valor de R$20, essa taxa fica em torno de R$1,30
      </Text>
      <Text style={styles.paragraph}>
        Você não é obrigado a aceitar corridas por cartão, seu serviço, suas
        regras, prezamos liberdade aqui.
      </Text>
      <Text style={[styles.subTitle]}>Cancelamento de corridas</Text>
      <Text style={styles.paragraph}>
        Não existe taxa sobre cancelamento de corridas, para ambos os lados da
        negociação, ela gera mais problemas que soluções por muitos usarem de ma
        fé, no lugar punições de bloqueio temporário(minutos) são aplicadas em
        eventos recorrentes.
      </Text>
    </Container>
  );
});
