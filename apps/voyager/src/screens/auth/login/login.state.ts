import { observable, action } from "mobx";
import { logInAsync } from "expo-google-app-auth";
import login from "@/api/login";
import { HttpException } from "@/api/exceptions";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";
import {
  GOOGLE_OAUTH_ID,
  NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION,
  VERIFICATION_RESEND_TIMEOUT,
} from "@/constants";
import { AppState } from "@/states";

type HttpExceptionsMessages =
  | HTTP_EXCEPTIONS_MESSAGES.USER_NOT_FOUND
  | HTTP_EXCEPTIONS_MESSAGES.WRONG_PASSWORD
  | HTTP_EXCEPTIONS_MESSAGES.CONTACT_VERIFICATION_FAILED;

const ErrorMessages = {
  [HTTP_EXCEPTIONS_MESSAGES.USER_NOT_FOUND]:
    "Conta não encontrada, verifique o número.",
  [HTTP_EXCEPTIONS_MESSAGES.WRONG_PASSWORD]: "Senha errada",
  [HTTP_EXCEPTIONS_MESSAGES.CONTACT_VERIFICATION_FAILED]: "Código errado",
};

type Errors = { id?: string; credential?: string; code?: string };

class LoginState {
  @observable loading = false;
  @observable errors: Errors = {};
  @observable indicateAccountCreation = false;
  @observable countryCode = "+55";
  @observable codeTarget = "";
  @observable resendSecondsLeft = 60;

  public phone: string = "";
  public notFoundResponses = 0;
  public verificationIat?: number;

  public getFullPhoneNumber() {
    return `${this.countryCode}${this.phone}`;
  }

  private handleApiHttpException(error: Error, key: keyof Errors) {
    if (error instanceof HttpException) {
      const message = error.message as HttpExceptionsMessages;

      if (message) {
        this.errors[key] = ErrorMessages[message];
      } else {
        console.log("TODO: bottom unknown error");
      }
      return;
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
        return "code";

      this.errors.id = "";
      this.loading = true;
      this.phone = phone;
      const response = await login.identify(this.getFullPhoneNumber());

      if (response.next === "code") {
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
      const result = await login.password({
        contact: this.getFullPhoneNumber(),
        password,
      });

      switch (result.next) {
        case "code":
          this.codeTarget = result.body.target;
          this.initiateVerificationResendCounter();
          break;
        case "authorized":
          await AppState.setToken(result.body.token);
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
      const result = await login.code({
        contact: this.getFullPhoneNumber(),
        code,
      });

      await AppState.setToken(result.body.token);
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

export default new LoginState();
