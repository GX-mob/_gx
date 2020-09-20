import Storage from "../modules/storage";
import { observable, action } from "mobx";
import { logInAsync } from "expo-google-app-auth";
import { signin } from "src/api/api";
import { IS_WEB, GOOGLE_OAUTH_WEB_ID, GOOGLE_OAUTH_ID } from "../constants";

export class LoginStore {
  @observable
  public loading = true;

  @observable
  public token = "";

  constructor() {
    this.init();
  }

  @action
  async init() {
    const token = await Storage.get("token");

    if (token) {
      this.token = token;
    }

    this.loading = false;
  }

  @action
  async identify(phone: string) {
    const result = await signin.get(phone);
    console.log(result);
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
