import React, { FC } from "react";
import {
  View,
  Text as RNText,
  TextProps,
  TextInput,
  TextInputProps,
  TouchableHighlight,
  TouchableHighlightProps,
  Image,
} from "react-native";
import { observer } from "mobx-react-lite";
import { ColorsThemeProperties } from "@interfaces";
import { UIStore } from "@stores";
import { TextInputMask, TextInputMaskProps } from "react-native-masked-text";

export const Input = observer<TextInputProps>(({ style, ...props }) => (
  <TextInput
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
  } & Partial<TouchableHighlightProps>
>(({ children, type, style, disabled, ...props }) => {
  const UpperFirstLetter = type.charAt(0).toUpperCase() + type.slice(1);

  const fontColorProp = `on${UpperFirstLetter}` as ColorsThemeProperties;
  const variantColor =
    (UIStore.theme.colors as any)[`${type}Variant`] ||
    UIStore.theme.colors[type];

  return (
    <TouchableHighlight
      disabled={disabled}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: UIStore.theme.borderRadius,
        backgroundColor: UIStore.theme.colors[type],
        opacity: disabled ? 0.5 : 1,
        marginVertical: 6,
        ...((style as object) || {}),
      }}
      underlayColor={variantColor}
      {...props}
    >
      <RNText
        style={{
          width: "100%",
          color: UIStore.theme.colors[fontColorProp],
          textAlign: "center",
          textAlignVertical: "center",
        }}
      >
        {children}
      </RNText>
    </TouchableHighlight>
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
