import styledWeb, { DefaultTheme } from "styled-components";
import styledNative from "styled-components/native";
import { IS_WEB } from "../constants";
import { View, TextInput } from "react-native";
import { FunctionComponent } from "react";

type styleFactory = (props: DefaultTheme) => string;

export function styledFactory<T>(
  factory: {
    web: any;
    native: any;
  },
  styleFactory: styleFactory
): FunctionComponent<T> {
  return IS_WEB
    ? factory.web`${({ theme }: any) => styleFactory(theme)}`
    : factory.native`${({ theme }: any) => styleFactory(theme)}`;
}

export const StyledDiv = <T>(styleFactory: styleFactory) =>
  styledFactory<Partial<JSX.IntrinsicElements["div"]> & Partial<View>>(
    {
      web: styledWeb.div,
      native: styledNative.View,
    },
    styleFactory
  );

export const StyledInput = <T>(styleFactory: styleFactory) =>
  styledFactory<Partial<JSX.IntrinsicElements["input"]> & Partial<TextInput>>(
    {
      web: styledWeb.input,
      native: styledNative.TextInput,
    },
    styleFactory
  );
