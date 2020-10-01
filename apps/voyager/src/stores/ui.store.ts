import { observable, action } from "mobx";
import { ThemeInterface } from "@interfaces";
import darkTheme from "../themes/dark";
import lightTheme from "../themes/light";

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
