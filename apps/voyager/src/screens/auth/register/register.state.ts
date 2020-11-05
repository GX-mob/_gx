import { observable, action } from "mobx";
import register from "@/api/register";
import { HttpException } from "@/api/exceptions";
import { IUserRegisterDto } from "@shared/interfaces";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";
import { AuthBaseState } from "../auth-base.state";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import diferenceInYears from "date-fns/differenceInYears";

type ErrorsNamespaces = {
  verify?: string;
  check?: string;
  cpf?: string;
  birth?: string;
  finish?: string;
};

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

class RegisterState extends AuthBaseState {
  @observable countryCode = "+55";
  @observable loading = false;
  @observable errors: ErrorsNamespaces = {};
  @observable cpf = "";
  @observable birth = "";

  @observable validations = {
    cpf: false,
    birth: false,
  };

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
      if (
        this.contact === contact &&
        this.verificationIat &&
        this.resendSecondsLeft > 0
      )
        return true;

      this.contact = contact;
      await this.request("verify", this.getContact());
      this.initiateVerificationResendCounter();

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

  isValidCPFAndBirth() {
    return [isValidCPF(this.cpf), this.isValidBirth(this.birth)];
  }

  @action setCpf(cpf: string) {
    this.cpf = cpf;

    if (cpf.length < 10) {
      this.errors.cpf = "";
    }

    if (cpf.length === 11) {
      this.errors.cpf = isValidCPF(cpf) ? "" : "CPF inválido";
    }
  }

  @action setBirth(birth: string) {
    this.birth = birth;
    if (birth.length < 8) {
      this.errors.birth = "";
    }

    if (birth.length === 10) {
      this.errors.birth = this.isValidBirth(birth)
        ? ""
        : "Você precisa ser maior de idade";
    }
  }

  isValidBirth(birth: string) {
    const dateItens = birth.split("/");
    const [day, month, year] = dateItens.map((item) => parseInt(item));
    const date = new Date(year, month, day);
    const differenceYears = diferenceInYears(date, new Date());

    return differenceYears <= -18;
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
