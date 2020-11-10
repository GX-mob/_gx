import { createRef } from "react";
import { RegisterScreens } from "./interfaces";

export const navigationRef = createRef<any>();

export function navigate(name: RegisterScreens) {
  navigationRef.current?.navigate(name);
}
