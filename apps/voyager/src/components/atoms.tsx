import React, { FC } from "react";
import {
  Text as RNText,
  TextProps,
  TextInput,
  TextInputProps,
  TouchableHighlight,
  TouchableHighlightProps,
} from "react-native";
import { observer } from "mobx-react-lite";
import { ColorsThemeProperties } from "@interfaces";
import { UIStore } from "@stores";
import ThemeableComponentFactory from "@modules/themeable-component-factory";
import { TextInputMask, TextInputMaskProps } from "react-native-masked-text";

export const Input = observer<TextInputProps>(({ style, ...props }) => (
  <TextInput
    style={{
      height: 40,
      paddingHorizontal: 12,
      borderRadius: UIStore.theme.borderRadius,
      backgroundColor: UIStore.theme.colors.surface,
      color: UIStore.theme.colors.onSurface,
      ...((style as object) || {}),
    }}
    {...props}
  />
));

export const InputMask = observer<TextInputMaskProps>(({ style, ...props }) => (
  <TextInputMask
    style={{
      height: 40,
      paddingHorizontal: 12,
      borderRadius: UIStore.theme.borderRadius,
      backgroundColor: UIStore.theme.colors.surface,
      color: UIStore.theme.colors.onSurface,
      ...((style as object) || {}),
    }}
    {...props}
  />
));

export const Button = observer<
  {
    type: ColorsThemeProperties;
  } & Partial<TouchableHighlightProps>
>(({ children, type, style, ...props }) => {
  const UpperFirstLetter = type.charAt(0).toUpperCase() + type.slice(1);

  const fontColorProp = `on${UpperFirstLetter}` as ColorsThemeProperties;
  const variantColor =
    (UIStore.theme.colors as any)[`${type}Variant`] ||
    UIStore.theme.colors[type];

  return (
    <TouchableHighlight
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: UIStore.theme.borderRadius,
        backgroundColor: UIStore.theme.colors[type],
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

export const ButtonBase = observer(
  ThemeableComponentFactory<TouchableHighlightProps>(
    TouchableHighlight,
    (theme) => ({
      height: "40px",
      padding: "10px",
      borderRadius: theme.borderRadius,
      backgroundColor: theme.colors.surface,
    }),
  ),
);

export const Text = observer<TextProps & { color?: ColorsThemeProperties }>(
  ({ style, color, ...props }) => (
    <RNText
      style={{
        color: UIStore.theme.colors[color || "onBackground"],
        ...((style as object) || {}),
      }}
      {...props}
    />
  ),
);
