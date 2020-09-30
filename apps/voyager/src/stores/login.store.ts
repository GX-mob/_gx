import SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-community/async-storage";
import { observable, action } from "mobx";
import { logInAsync } from "expo-google-app-auth";
import { IdentifyResponseInterface } from "@shared/interfaces";
import signIn from "@apis/signin";
import { HttpException } from "@apis/exceptions";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";
import {
  TOKEN_STORAGE_KEY,
  GOOGLE_OAUTH_WEB_ID,
  GOOGLE_OAUTH_ID,
  NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION,
  VERIFICATION_RESEND_TIMEOUT,
} from "../constants";
import { SignInScreens } from "@screens/signin/common";

type HttpExceptions =
  | HTTP_EXCEPTIONS_MESSAGES.USER_NOT_FOUND
  | HTTP_EXCEPTIONS_MESSAGES.WRONG_PASSWORD
  | HTTP_EXCEPTIONS_MESSAGES.WRONG_CODE;

const ErrorMessages = {
  [HTTP_EXCEPTIONS_MESSAGES.USER_NOT_FOUND]:
    "Conta não encontrada, verifique o número.",
  [HTTP_EXCEPTIONS_MESSAGES.WRONG_PASSWORD]: "Senha errada",
  [HTTP_EXCEPTIONS_MESSAGES.WRONG_CODE]: "Código errado",
};

type Errors = { id?: string; credential?: string; code?: string };

class LoginStore {
  private secureStorageAvailable!: boolean;

  @observable
  public initializing = true;

  @observable
  public loading = false;

  @observable
  public token = "";

  @observable
  public errors: Errors = {};

  @observable
  public indicateAccountCreation = false;

  @observable
  public countryCode = "+55";
  public phone: string = "";

  @observable
  public profile?: IdentifyResponseInterface;
  public notFoundResponses = 0;
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

  private getFullPhoneNumber() {
    return `${this.countryCode}${this.phone}`;
  }

  private handleApiHttpException(error: Error, key: keyof Errors) {
    if (error instanceof HttpException) {
      const message = error.message as HttpExceptions;

      if (message) {
        this.errors[key] = ErrorMessages[message];
      } else {
        console.log("TODO: bottom unknown error");
      }
    }
  }

  @action
  async identify(phone: string) {
    try {
      if (
        this.phone === phone &&
        this.verificationIat &&
        this.resendSecondsLeft > 0
      )
        return SignInScreens.Code;

      this.errors.id = "";
      this.loading = true;
      this.phone = phone;

      const response = await signIn.identify(this.getFullPhoneNumber());

      this.profile = response.content;

      if (response.next === SignInScreens.Code) {
        this.initiateVerificationResendCounter();
      }

      return response.next;
    } catch (error) {
      this.handleApiHttpException(error, "id");
      if (error.message === HTTP_EXCEPTIONS_MESSAGES.USER_NOT_FOUND) {
        this.notFoundResponses++;

        if (
          this.notFoundResponses >=
          NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION
        ) {
          this.indicateAccountCreation = true;
        }
      }
    } finally {
      this.loading = false;
    }
  }

  private initiateVerificationResendCounter() {
    this.verificationIat = Date.now();
    this.resendSecondsLeft = this.calculateSecondsLeft(this.verificationIat);
    setTimeout(() => this.calculateVerificationResend(), 1000);
  }

  private calculateSecondsLeft(iat: number) {
    return (
      Math.round(iat / 1000) +
      VERIFICATION_RESEND_TIMEOUT -
      Math.round(Date.now() / 1000)
    );
  }

  private calculateVerificationResend() {
    this.resendSecondsLeft = this.calculateSecondsLeft(
      this.verificationIat as number,
    );

    this.resendSecondsLeft > 0 &&
      setTimeout(() => this.calculateVerificationResend(), 1000);
  }

  @action
  async password(password: string) {
    try {
      this.errors.credential = "";
      this.loading = true;
      const result = await signIn.password({
        phone: this.getFullPhoneNumber(),
        password,
      });

      switch (result.next) {
        case SignInScreens.Code:
          this.initiateVerificationResendCounter();
          break;
        case "Main":
          await this.setToken(result.content.token);
          this.token = result.content.token;
          return;
      }

      return result.next;
    } catch (error) {
      this.handleApiHttpException(error, "credential");
    } finally {
      this.loading = false;
    }
  }

  @action
  async code(code: string) {
    try {
      this.errors.code = "";
      this.loading = true;
      const result = await signIn.code({
        phone: this.getFullPhoneNumber(),
        code,
      });

      if (result.next === "Main") {
        await this.setToken(result.content.token);
        this.token = result.content.token;
      }
    } catch (error) {
      this.handleApiHttpException(error, "code");
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
    return this.secureStorageAvailable
      ? SecureStore.getItemAsync(TOKEN_STORAGE_KEY)
      : AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private setToken(token: any) {
    if (this.secureStorageAvailable) {
      return SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    }

    return AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export default new LoginStore();
