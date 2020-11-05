import { observable, action } from "mobx";
import register from "@/api/register";
import { HttpException } from "@/api/exceptions";
import { IUserRegisterDto } from "@shared/interfaces";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";
import { AuthBaseState } from "../auth-base.state";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import diferenceInYears from "date-fns/differenceInYears";
import { MINIMUN_REGISTER_AGE, MAXIMUN_REGISTER_AGE } from "@/constants";

type ErrorsNamespaces = {
  verify?: string;
  check?: string;
  cpf?: string;
  birth?: string;
  name?: string;
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
  @observable firstName = "";
  @observable lastName = "";
  @observable validations = {
    cpf: false,
    birth: false,
    name: false,
  };

  contact = "";
  birthDateObject?: Date;

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
    return [this.validateCPF(), this.validateBirth()];
  }

  @action setCpf(cpf: string) {
    this.cpf = cpf;
    this.validations.cpf = false;

    if (cpf.length < 10) {
      this.errors.cpf = "";
    }

    if (cpf.length === 11) {
      const valid = this.validateCPF();
      return valid;
    }

    return false;
  }

  @action validateCPF() {
    if (this.cpf === "") {
      this.errors.cpf = "Digite o CPF";

      return false;
    }

    const isValid = this.isValidCPF(this.cpf);
    this.validations.cpf = isValid;
    this.errors.cpf = isValid ? "" : "CPF inválido";

    return isValid;
  }

  isValidCPF(cpf: string) {
    return isValidCPF(cpf);
  }

  @action setBirth(birth: string) {
    this.birth = birth;
    this.validations.birth = false;
    if (birth.length < 8) {
      this.errors.birth = "";
    }

    if (birth.length === 10) {
      this.errors.birth = "";
      const isValid = this.validateBirth();
      if (isValid) this.birthDateObject = this.makeDateObject(birth);
      return isValid;
    }

    return false;
  }

  @action validateBirth() {
    if (this.birth.length <= 9) {
      this.errors.birth = "Data inválida";
      return false;
    }

    const [isValidBirth, hasMinimum, isMaximum] = this.isValidBirth(this.birth);
    this.validations.birth = isValidBirth;
    if (!hasMinimum) {
      this.errors.birth = "Você precisa ser maior de idade para se cadastrar";
      return isValidBirth;
    }

    if (isMaximum) {
      this.errors.birth = "Desculpa, mas o limite é de 70 anos.";
    }
    return isValidBirth;
  }

  isValidBirth(birth: string) {
    const yearsDiff = this.getYearsDiff(birth);
    const hasMinimum = yearsDiff <= MINIMUN_REGISTER_AGE;
    const isMaximum = yearsDiff <= MAXIMUN_REGISTER_AGE;

    return [hasMinimum && !isMaximum, hasMinimum, isMaximum];
  }

  private getYearsDiff(birth: string) {
    const date = this.makeDateObject(birth);
    return diferenceInYears(date, new Date());
  }

  private makeDateObject(birth: string) {
    const dateItens = birth.split("/");
    const [day, month, year] = dateItens.map((item) => parseInt(item));
    return new Date(year, month, day);
  }

  @action setName(name: string) {
    const nameSplit = name.split(" ");
    const [firstName, ...rest] = nameSplit;

    if (firstName.length < 4) return;

    const lastName = rest.join(" ");
    const hasLastName = nameSplit.length > 1;
    this.validations.name = false;

    this.errors.name = "";

    if (hasLastName) {
      this.firstName = firstName;
      this.lastName = lastName;

      const allNamesValidate =
        nameSplit.filter((name) => name.length >= 3).length ===
        nameSplit.length;

      if (!allNamesValidate) {
        this.errors.name = "Digite o nome e sobrenome";
        return;
      }

      return (this.validations.name = true);
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
