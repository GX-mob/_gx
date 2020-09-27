import SecureStore from "expo-secure-store";
import Storage from "../modules/storage";
import { observable, action } from "mobx";
import { logInAsync } from "expo-google-app-auth";
import { IdentifyResponseInterface } from "@shared/interfaces";
import { identify, password, SignInSteps } from "@apis/signin";
import { HttpException } from "@apis/exceptions";
import {
  GOOGLE_OAUTH_WEB_ID,
  GOOGLE_OAUTH_ID,
  NOT_FOUND_RESPONSES_TO_SUGGEST_WRONG_NUMBER,
  NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION,
} from "../constants";

class LoginStore {
  private secureStoreAvailable!: boolean;

  @observable
  public initializing = true;

  @observable
  public loading = false;

  @observable
  public token = "";

  @observable
  public error?: string;

  @observable
  public suggestNumberWrong = false;

  @observable
  public indicateAccountCreation = false;

  public profile?: IdentifyResponseInterface;
  public phone: string = "";
  public notFoundResponse = 0;

  @observable
  public renewExpiration?: number;

  constructor() {
    //this.secureStoreAvailable = SecureStore.

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
      this.loading = true;
      const response = await identify(phone);

      this.phone = phone;

      return response.next;
    } catch (error) {
      if (error instanceof HttpException) {
        switch (error.statusCode) {
          case 404:
            this.notFoundResponse++;

            if (
              this.notFoundResponse >=
              NOT_FOUND_RESPONSES_TO_SUGGEST_WRONG_NUMBER
            ) {
              this.suggestNumberWrong = true;
            }

            if (
              this.notFoundResponse >=
              NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION
            ) {
              this.indicateAccountCreation = true;
            }
            break;
        }
      }
    } finally {
      this.loading = false;
    }
  }

  @action
  async password(pw: string) {
    try {
      this.loading = true;
      const result = await password({ phone: this.phone, password: pw });

      if (result.next === SignInSteps.Main) {
      }
    } catch (error) {
      if (error instanceof HttpException) {
        switch (error.statusCode) {
          case 422:
            this.error = "Senha errada.";
            break;
        }
      }
    } finally {
      this.loading = false;
    }
  }

  @action
  async code(code: string) {}

  @action
  async loginWithGoogle() {
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

  private getData(key: string) {}
  private setData(key: string, data: any) {}
}

export default new LoginStore();
