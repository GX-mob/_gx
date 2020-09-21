import Storage from "../modules/storage";
import ky from "ky";
import { observable, action } from "mobx";
import { logInAsync } from "expo-google-app-auth";
import { identify, NextStep } from "../api/signin";
import { IdentifyResponseInterface } from "@shared/interfaces";
import {
  IS_WEB,
  GOOGLE_OAUTH_WEB_ID,
  GOOGLE_OAUTH_ID,
  NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION,
} from "../constants";

class LoginStore {
  @observable
  public initializing = true;

  @observable
  public loading = false;

  @observable
  public token = "";

  @observable
  public notFoundResponse = 0;

  @observable
  public indicateAccountCreation = false;

  public profile?: IdentifyResponseInterface;

  constructor() {
    this.init();
  }

  @action
  async init() {
    const token = await Storage.get("token");

    if (token) {
      this.token = token;
    }

    this.initializing = false;
  }

  @action
  async identify(phone: string) {
    try {
      const response = await identify(phone);

      switch (response.next) {
        case NextStep.Password:
          console.log("goto password");
          break;
        case NextStep.Code:
          console.log("goto code");
          break;
      }
    } catch (error) {
      if (
        this.notFoundResponse >=
        NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION
      ) {
        this.indicateAccountCreation = true;
      }

      switch (error.statusCode) {
        case 404:
          this.notFoundResponse++;
          break;
      }
    }
  }

  @action
  async loginWithGoogle() {
    if (IS_WEB) {
      return console.log("TODO WEB LOGIN");
    }

    try {
      const result = await logInAsync({
        clientId: GOOGLE_OAUTH_WEB_ID,
        androidClientId: GOOGLE_OAUTH_ID,
        scopes: [
          "profile",
          "email",
          "https://www.googleapis.com/auth/user.phonenumbers.read",
        ],
      });

      if (result.type === "success") {
        return result.accessToken;
      } else {
        return { cancelled: true };
      }
    } catch (e) {
      console.log(e);
      return { error: true };
    }
  }
}

export default new LoginStore();
