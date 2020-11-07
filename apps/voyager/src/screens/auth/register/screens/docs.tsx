import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { observer } from "mobx-react-lite";
import * as ImagePicker from "expo-image-picker";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import { UIStore } from "@/states";
import { Text, Button } from "@/components/atoms";
import { Container, NextButton } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const DocsScreen = observer<RegisterScreenProps>(({ navigation }) => {
  const pickImage = async (to: "CNH" | "AAC") => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.cancelled) {
      RegisterState.setDocumentPicture(result.uri, to);
    }
  };

  return (
    <Container>
      <Text style={styles.title}>Documentos</Text>
      <Text style={styles.paragraph}>
        Precisamos que você tire foto da sua CNH, ela precisa ter a observação
        EAR e também de um Atestado de Antecedentes Criminais em seu nome.
      </Text>
      <UploadItemContainer
        label="Escolher CNH"
        onPress={() => pickImage("CNH")}
        picture={RegisterState.cnhPicture}
      />
      <UploadItemContainer
        label="Escolher Atestado de Antecedentes"
        onPress={() => pickImage("AAC")}
        picture={RegisterState.aacPicture}
      />
      <NextButton
        mode="full"
        visible={RegisterState.validations.docs}
        onPress={() => {
          if (RegisterState.validations.docs) {
            navigation.navigate("finish");
          }
        }}
      >
        Enviar
      </NextButton>
    </Container>
  );
});

const UploadItemContainer = observer<{
  picture: string;
  label: string;
  onPress: (...args: any) => any;
}>(({ picture, label, onPress }) => {
  return (
    <Pressable
      style={[
        localStyles.item,
        { backgroundColor: UIStore.theme.colors.surface },
      ]}
      onPress={onPress}
    >
      {picture ? (
        <Image source={{ uri: picture }} style={localStyles.itemCover} />
      ) : null}
      <Text color={"onBackground"}>{label}</Text>
      {picture ? (
        <Text color={"success"} style={{ textAlign: "center" }}>
          <MaterialIcons name="check" size={18} />
        </Text>
      ) : null}
    </Pressable>
  );
});

const localStyles = StyleSheet.create({
  item: {
    width: "100%",
    height: 60,
    marginBottom: 8,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
  },
  itemCover: {
    position: "absolute",
    width: "100%",
    height: 60,
    borderRadius: 3,
    opacity: 0.2,
  },
});
