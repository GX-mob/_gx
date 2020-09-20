import React, { FunctionComponent, Component } from "react";
import { NativeMethods } from "react-native";
import UI, { Theme } from "@stores/ui";

type Constructor<T> = new (...args: any[]) => T;

export default function ThemeableComponentFactory<
  Props extends { style?: any }
>(
  ComponentConstructor: Constructor<NativeMethods> & typeof Component,
  styleMaker: (theme: Theme) => Props["style"],
): FunctionComponent<Props> {
  return ({ style, ...props }: any) => (
    <ComponentConstructor
      style={{ ...(styleMaker(UI.theme) || {}), ...style }}
      {...props}
    />
  );
}
