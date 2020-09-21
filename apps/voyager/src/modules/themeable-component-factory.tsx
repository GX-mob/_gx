import React, { FunctionComponent, Component } from "react";
import { NativeMethods } from "react-native";
import { ThemeInterface } from "@interfaces";
import UI from "@stores/ui.store";

type Constructor<T> = new (...args: any[]) => T;

export default function ThemeableComponentFactory<
  Props extends { style?: any }
>(
  ComponentConstructor: Constructor<NativeMethods> & typeof Component,
  styleMaker: (theme: ThemeInterface) => Props["style"],
): FunctionComponent<Props> {
  return ({ style, ...props }: any) => (
    <ComponentConstructor
      style={{ ...(styleMaker(UI.theme) || {}), ...style }}
      {...props}
    />
  );
}
