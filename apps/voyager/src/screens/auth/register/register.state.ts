import { observable, action } from "mobx";
import register from "@/api/register";
import { HttpException } from "@/api/exceptions";
import { IUserRegisterDto } from "@shared/interfaces";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";

type ErrorsNamespaces = { verify?: string; check?: string; finish?: string };

const ErrorMessages = {
  [HTTP_EXCEPTIONS_MESSAGES.TERMS_NOT_ACCEPTED]:
    "Você precisa aceitar os termos de uso.",
  [HTTP_EXCEPTIONS_MESSAGES.CONTACT_ALREADY_REGISTRED]:
    "Desculpa, esse número já está registrado.",
  [HTTP_EXCEPTIONS_MESSAGES.CONTACT_VERIFICATION_FAILED]: "Código errado",
  [HTTP_EXCEPTIONS_MESSAGES.INVALID_CPF]: "Número de CPF inválido",
  [HTTP_EXCEPTIONS_MESSAGES.CPF_REGISTRED]:
    "Esse CPF já está registrado, se ele é seu e você não se registrou, por favor, entre em contato.",
};

class RegisterState {
  @observable countryCode = "+55";
  @observable loading = false;
  @observable errors: ErrorsNamespaces = {};

  contact = "";

  request<K extends keyof typeof register>(
    action: K,
    arg: Parameters<typeof register[K]>[0],
  ) {
    this.loading = true;
    return register[action](arg as any);
  }

  getContact() {
    return `${this.countryCode}${this.contact}`;
  }

  @action async verify(contact: string) {
    try {
      this.contact = contact;
      await this.request("verify", this.getContact());
      return true;
    } catch (error) {
      this.exceptionHandler(error, "verify");
      return false;
    } finally {
      this.loading = false;
    }
  }

  @action async check(code: string) {
    try {
      await this.request("check", {
        contact: this.getContact(),
        code,
      });
    } catch (error) {
      this.exceptionHandler(error, "check");
    } finally {
      this.loading = false;
    }
  }

  @action async finish(body: IUserRegisterDto) {
    try {
      await this.request("check", body);
    } catch (error) {
      this.exceptionHandler(error, "finish");
    } finally {
      this.loading = false;
    }
  }

  exceptionHandler(error: Error, key: keyof ErrorsNamespaces) {
    if (error instanceof HttpException) {
      const errorMessage = error.message as keyof typeof ErrorMessages;
      this.errors[key] = ErrorMessages[errorMessage] || "Tente novamente";

      return;
    }
  }
}

export default new RegisterState();
