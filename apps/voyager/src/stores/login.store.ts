import SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-community/async-storage";
import { observable, action } from "mobx";
import { logInAsync } from "expo-google-app-auth";
import { utcToZonedTime } from "date-fns-tz";
import { IdentifyResponseInterface } from "@shared/interfaces";
import * as signIn from "@apis/signin";
import { HttpException } from "@apis/exceptions";
import {
  TOKEN_STORAGE_KEY,
  GOOGLE_OAUTH_WEB_ID,
  GOOGLE_OAUTH_ID,
  NOT_FOUND_RESPONSES_TO_SUGGEST_WRONG_NUMBER,
  NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION,
} from "../constants";

class LoginStore {
  private secureStorageAvailable!: boolean;

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
  public verificationIat?: number;

  @observable
  public resendSecondsLeft = 60;

  constructor() {
    this.init();
  }

  @action
  async init() {
    try {
      this.secureStorageAvailable = await SecureStore.isAvailableAsync();
    } catch (e) {}

    const token = await this.getToken();

    if (token) {
      this.token = token;
    }

    this.initializing = false;
  }

  private calculateVerificationResend() {
    this.resendSecondsLeft = this.calculateSecondsLeft(
      this.verificationIat as number,
    );

    this.resendSecondsLeft > 0 &&
      setTimeout(() => this.calculateVerificationResend(), 1000);
  }

  private calculateSecondsLeft(iat: number) {
    return Math.round(iat / 1000) + 60 - Math.round(Date.now() / 1000);
  }

  @action
  async identify(phone: string) {
    try {
      if (
        this.phone === phone &&
        this.verificationIat &&
        this.resendSecondsLeft > 0
      )
        return signIn.SignInSteps.Code;

      this.loading = true;
      const response = await signIn.identify(`+55${phone}`);

      this.phone = phone;

      if (response.next === signIn.SignInSteps.Code) {
        this.verificationIat = Date.now();
        this.resendSecondsLeft = this.calculateSecondsLeft(
          this.verificationIat,
        );
        console.log("@", this.resendSecondsLeft);
        setTimeout(() => this.calculateVerificationResend(), 1000);
      }

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
      } else {
        console.warn(error);
      }
    } finally {
      this.loading = false;
    }
  }

  @action
  async password(password: string) {
    try {
      this.loading = true;
      const result = await signIn.password({ phone: this.phone, password });

      switch (result.next) {
        case signIn.SignInSteps.Code:
          this.verificationIat = utcToZonedTime(
            result.content.iat,
            Localization.timezone,
          ).getTime();
          break;
        case signIn.SignInSteps.Main:
          this.setToken(result.content.token);
          break;
      }

      return result.next;
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
  async code(code: string) {
    try {
      this.loading = true;
      const result = await signIn.code({ phone: this.phone, code });

      if (result.next === signIn.SignInSteps.Main) {
        this.setToken(result.content.token);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        switch (error.statusCode) {
          case 422:
            this.error = "Código errado.";
            break;
        }
      }
    } finally {
      this.loading = false;
    }
  }

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

  private async getToken() {
    let item: any;

    item = await (this.secureStorageAvailable
      ? SecureStore.getItemAsync(TOKEN_STORAGE_KEY)
      : AsyncStorage.getItem(TOKEN_STORAGE_KEY));

    return item !== null ? JSON.parse(item) : null;
  }
  private setToken(token: any) {
    if (this.secureStorageAvailable) {
      return SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    }

    return AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export default new LoginStore();
