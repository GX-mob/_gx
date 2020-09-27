import { observable, action } from "mobx";
import darkTheme from "../styles/themes/dark";
import lightTheme from "../styles/themes/light";
import { ThemeInterface } from "@interfaces";

class UIStore {
  @observable
  theme: ThemeInterface = lightTheme;

  constructor() {
    /*setInterval(() => {
      this.toggle();
      console.log("toggle, new", this.theme.id);
    }, 10000);*/
  }

  @action
  toggle() {
    this.theme = this.theme.name === "dark" ? lightTheme : darkTheme;
  }
}

export default new UIStore();
