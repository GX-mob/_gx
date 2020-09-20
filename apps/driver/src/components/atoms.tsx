import React, { FC } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableHighlight,
  TouchableHighlightProps,
} from "react-native";
import { observer } from "mobx-react-lite";
import UI, { ColorsProperties } from "@stores/ui";
import ThemeableComponentFactory from "@modules/themeable-component-factory";
import { TextInputMask, TextInputMaskProps } from "react-native-masked-text";

export const Input = observer<TextInputProps>(({ style, ...props }) => (
  <TextInput
    style={{
      height: 40,
      paddingHorizontal: 12,
      borderRadius: UI.theme.borderRadius,
      backgroundColor: UI.theme.colors.surface,
      color: UI.theme.colors.onSurface,
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
      borderRadius: UI.theme.borderRadius,
      backgroundColor: UI.theme.colors.surface,
      color: UI.theme.colors.onSurface,
      ...((style as object) || {}),
    }}
    {...props}
  />
));

export const Button = observer<
  {
    type: ColorsProperties;
  } & Partial<TouchableHighlightProps>
>(({ children, type, style, ...props }) => {
  const UpperFirstLetter = type.charAt(0).toUpperCase() + type.slice(1);

  const fontColorProp = `on${UpperFirstLetter}` as ColorsProperties;
  const variantColor =
    (UI.theme.colors as any)[`${type}Variant`] || UI.theme.colors[type];

  return (
    <TouchableHighlight
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: UI.theme.borderRadius,
        backgroundColor: UI.theme.colors[type],
        ...((style as object) || {}),
      }}
      underlayColor={variantColor}
      {...props}
    >
      <Text
        style={{
          width: "100%",
          color: UI.theme.colors[fontColorProp],
          textAlign: "center",
          textAlignVertical: "center",
        }}
      >
        {children}
      </Text>
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
    })
  )
);
