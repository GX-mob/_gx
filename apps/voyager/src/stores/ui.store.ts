import { observable, action } from "mobx";
import darkTheme from "../styles/themes/dark";
import lightTheme from "../styles/themes/light";
import { ThemeInterface } from "@interfaces";

class UIStore {
  @observable
  theme: ThemeInterface = darkTheme;

  constructor() {
    this.init();
  }

  @action
  init() {}

  @action
  toggle() {
    this.theme = this.theme.name === "dark" ? lightTheme : darkTheme;
    // AsynStorage.setItem("uiTheme", this.theme)
  }
}

export default new UIStore();
