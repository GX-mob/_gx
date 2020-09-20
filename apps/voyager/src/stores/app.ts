import { observable, action } from "mobx";

class AppStore {
  @observable
  public launched = false;

  constructor() {
    this.init();
  }

  @action
  async init() {}
}

export default new AppStore();
