import React from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { LinearGradient } from "expo-linear-gradient";
import { Text, Input } from "@/components/atoms";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const DocsScreen = observer<RegisterScreenProps>(({ navigation }) => {
  return <Container></Container>;
});
