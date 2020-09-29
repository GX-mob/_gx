import React, { FC } from "react";
import {
  StyleProp,
  View,
  Text as RNText,
  TextStyle,
  TextProps,
  TextInput,
  TextInputProps,
  Pressable,
  PressableProps,
  Image,
} from "react-native";
import { observer } from "mobx-react-lite";
import { ColorsThemeProperties } from "@interfaces";
import UIStore from "@stores/ui.store";
import { TextInputMask, TextInputMaskProps } from "react-native-masked-text";

export type InputStatus = "error" | "warn";

export const Input = observer<TextInputProps & { status?: InputStatus }>(
  ({ style, status, ...props }) => {
    let aditionalStyle: TextInputProps["style"] = {};
    switch (status) {
      case "error":
        aditionalStyle = {
          borderWidth: 2,
          borderColor: UIStore.theme.colors.error,
          color: UIStore.theme.colors.error,
        };
        break;
      case "warn":
        aditionalStyle = {
          borderWidth: 2,
          borderColor: UIStore.theme.colors.warn,
          color: UIStore.theme.colors.warn,
        };
        break;
    }

    return (
      <TextInput
        placeholderTextColor={UIStore.theme.colors.onSurface}
        style={[
          {
            height: 40,
            paddingHorizontal: 20,
            borderRadius: UIStore.theme.borderRadius,
            backgroundColor: UIStore.theme.colors.surface,
            color: UIStore.theme.colors.onSurface,
            marginVertical: 6,
            ...aditionalStyle,
          },
          style,
        ]}
        {...props}
      />
    );
  },
);

export const InputMask = observer<TextInputMaskProps>(({ style, ...props }) => (
  <TextInputMask
    placeholderTextColor={UIStore.theme.colors.onSurface}
    style={{
      height: 40,
      paddingHorizontal: 20,
      borderRadius: UIStore.theme.borderRadius,
      backgroundColor: UIStore.theme.colors.surface,
      color: UIStore.theme.colors.onSurface,
      marginVertical: 6,
      ...((style as object) || {}),
    }}
    {...props}
  />
));

export const Button = observer<
  {
    type: ColorsThemeProperties;
    textStyle?: StyleProp<TextStyle>;
  } & Partial<PressableProps>
>(({ children, textStyle, type, style, disabled, ...props }) => {
  const UpperFirstLetter = type.charAt(0).toUpperCase() + type.slice(1);

  const fontColorProp = `on${UpperFirstLetter}` as ColorsThemeProperties;
  const variantColor =
    (UIStore.theme.colors as any)[`${type}Variant`] ||
    UIStore.theme.colors[type];

  return (
    <Pressable
      disabled={disabled}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: UIStore.theme.borderRadius,
        backgroundColor: UIStore.theme.colors[type],
        opacity: disabled ? 0.6 : 1,
        marginVertical: 6,
        ...((style as object) || {}),
      }}
      {...props}
    >
      <RNText
        style={[
          {
            width: "100%",
            color: UIStore.theme.colors[fontColorProp],
            textAlign: "center",
            textAlignVertical: "center",
          },
          textStyle,
        ]}
      >
        {children}
      </RNText>
    </Pressable>
  );
});

export const Text = observer<TextProps & { color?: ColorsThemeProperties }>(
  ({ style, color, ...props }) => {
    const finalStyle = Array.isArray(style)
      ? [
          ...style,
          {
            color: UIStore.theme.colors[color || "onBackground"],
            fontFamily: "Roboto",
          },
        ]
      : {
          color: UIStore.theme.colors[color || "onBackground"],
          fontFamily: "Roboto",
          ...((style as object) || {}),
        };

    return <RNText style={finalStyle} {...props} />;
  },
);

export const Divider = observer(() => {
  return (
    <View
      style={{
        width: "80%",
        height: 0.5,
        marginVertical: 12,
        opacity: 0.4,
        backgroundColor: UIStore.theme.colors.onBackground,
      }}
    />
  );
});

export const Avatar: FC<{ size: number; uri: string }> = ({ size, uri }) => {
  return (
    <Image
      style={{
        borderRadius: size,
        width: size,
        height: size,
        resizeMode: "cover",
      }}
      source={{ uri }}
    />
  );
};
