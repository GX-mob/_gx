import React, { useState, useEffect } from "react";
import { View, Pressable, Image, ActivityIndicator } from "react-native";
import { observer } from "mobx-react-lite";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Text, Input } from "@/components/atoms";
import { UIStore } from "@/states";
import { Container, NextButton, Alert } from "../../components";
import { styles } from "../../styles";
import { RegisterScreenProps } from "../../interfaces";
import RegisterState from "../register.state";

export const ProfileStep = observer<RegisterScreenProps>(({ navigation }) => {
  const [name, setName] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const image = RegisterState.profielPicture;
  const {
    name: validName,
    profilePicture: validProfilePicture,
  } = RegisterState.validations;
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.cancelled) {
      setImageLoading(true);
      await RegisterState.setProfilePicture(result.uri);
      setImageLoading(false);
    }
  };
  const handleSubmit = () => {
    if (validName && validProfilePicture) {
      return RegisterState.next();
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraRollPermissionsAsync();
      if (status !== "granted") {
        alert(
          "Desculpa, precisamos que você dê permissão para poder escolher uma foto de perfil.",
        );
      }
    })();
  }, []);

  return (
    <Container>
      <Text style={styles.subTitle}>Escolha uma foto e digite seu nome</Text>
      <View
        style={[
          {
            width: 130,
            height: 130,
            borderRadius: 130,
            marginVertical: 20,
            backgroundColor: "#111",
          },
        ]}
      >
        {image && !imageLoading ? (
          <LinearGradient
            colors={[
              UIStore.theme.colors.background,
              validProfilePicture
                ? UIStore.theme.colors.success
                : UIStore.theme.colors.error,
            ]}
            style={{
              position: "absolute",
              width: 130,
              height: 130,
              borderRadius: 130,
            }}
          />
        ) : null}
        {image ? (
          <Image
            source={{ uri: image }}
            style={{
              borderRadius: 130,
              position: "absolute",
              width: 126,
              height: 126,
              top: 2,
              left: 2,
              opacity: imageLoading ? 0.2 : 1,
            }}
          />
        ) : (
          <Text
            style={{
              fontSize: 12,
              position: "absolute",
              paddingHorizontal: 20,
              paddingVertical: 48,
              textAlign: "center",
              opacity: 0.7,
            }}
          >
            Toque para escolher
          </Text>
        )}
        {imageLoading ? (
          <ActivityIndicator
            color={UIStore.theme.colors.onBackground}
            size={24}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: [{ translateX: -12 }, { translateY: -12 }],
            }}
          />
        ) : null}
        <Pressable
          style={{
            position: "absolute",
            width: 130,
            height: 130,
          }}
          onPress={pickImage}
        />
      </View>
      <Alert type="error" visible={!!RegisterState.errors.profilePicture}>
        {RegisterState.errors.profilePicture}
      </Alert>
      <View style={{ width: "100%" }}>
        <Input
          status={validName ? "success" : "normal"}
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
        <NextButton
          mode="attached"
          visible={validName && validProfilePicture}
          onPress={handleSubmit}
          disabled={RegisterState.loading}
          loading={RegisterState.loading}
        />
      </View>
    </Container>
  );
});
