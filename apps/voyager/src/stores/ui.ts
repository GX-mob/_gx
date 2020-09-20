import { observable, action } from "mobx";
import darkTheme from "../styles/themes/dark";
import lightTheme from "../styles/themes/light";

export type ColorsProperties =
  | "primary"
  | "primaryVariant"
  | "secondary"
  | "secondaryVariant"
  | "surface"
  | "background"
  | "surface"
  | "error"
  | "warn";

export interface Theme {
  id: string;
  borderRadius: number;
  statusBarStyle: "light" | "dark";
  colors: {
    primary: string;
    primaryVariant: string;
    onPrimary: string;
    secondary: string;
    secondaryVariant: string;
    onSecondary: string;
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    error: string;
    onError: string;
    warn: string;
    onWarn: string;
  };
}

class UI {
  @observable
  theme: Theme = darkTheme;

  constructor() {
    /*setInterval(() => {
      this.toggle();
      console.log("toggle, new", this.theme.id);
    }, 10000);*/
  }

  @action
  toggle() {
    this.theme = this.theme.id === "dark" ? lightTheme : darkTheme;
  }
}

export default new UI();
