import { StackScreenProps } from "@react-navigation/stack";
import {
  IAuthIdentifyResponse,
  IAuthPasswordResponse,
} from "@shared/interfaces";

export type AuthScreens = "login" | "register" | "recovery";

export type LoginScreens =
  | AuthScreens
  | "identify"
  | IAuthIdentifyResponse["next"]
  | IAuthPasswordResponse["next"];

export type LoginScreenProps = StackScreenProps<
  Record<LoginScreens, undefined>
>;

export type RegisterScreens =
  | AuthScreens
  | "verify"
  | "check"
  | "cpf"
  | "profile"
  | "password" // optional
  | "docs"
  | "finish";

export type AuthScreenProps = StackScreenProps<
  Record<RegisterScreens, undefined>
>;
