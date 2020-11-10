import { observable, action } from "mobx";
import diferenceInYears from "date-fns/differenceInYears";
import * as FaceDetector from "expo-face-detector";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import validator from "validator";
import ky from "ky";
import register, { IHttpException } from "@/api/register";
import { IUserRegisterDto } from "@shared/interfaces";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";
import { MINIMUN_REGISTER_AGE, MAXIMUN_REGISTER_AGE } from "@/constants";
import { AuthBaseState } from "../auth-base.state";
import { navigationRef, navigate } from "../navigation";
import { RegisterScreens } from "../interfaces";

type ErrorsNamespaces = {
  contact?: string;
  code?: string;
  cpf?: string;
  birth?: string;
  name?: string;
  profilePicture?: string;
  finish?: string;
};

type TValidations = {
  terms: boolean;
  contact: boolean;
  code: boolean;
  cpf: boolean;
  birth: boolean;
  name: boolean;
  profilePicture: boolean;
  password: boolean;
  // docs: boolean;
};

const ErrorMessages = {
  [HTTP_EXCEPTIONS_MESSAGES.TERMS_NOT_ACCEPTED]:
    "Você precisa aceitar os termos de uso.",
  [HTTP_EXCEPTIONS_MESSAGES.INVALID_CONTACT]: "Contato inválido.",
  [HTTP_EXCEPTIONS_MESSAGES.CONTACT_ALREADY_REGISTRED]:
    "Desculpa, esse número já está registrado.",
  [HTTP_EXCEPTIONS_MESSAGES.CONTACT_VERIFICATION_FAILED]: "Código errado",
  [HTTP_EXCEPTIONS_MESSAGES.INVALID_CPF]: "Número de CPF inválido",
  [HTTP_EXCEPTIONS_MESSAGES.CPF_REGISTRED]:
    "Esse CPF já está registrado, se ele é seu e você não se registrou, por favor, entre em contato.",
};

class RegisterState extends AuthBaseState {
  @observable countryCode = "+55";

  // UI Control
  @observable loading = false;
  @observable errors: ErrorsNamespaces = {};
  @observable snackVisible = false;
  @observable snackContent = "";

  // Register fields
  @observable terms = false;
  contact = "";
  code = "";
  @observable cpf = "";
  @observable birth = "";
  @observable firstName = "";
  @observable lastName = "";
  @observable profielPicture = "";
  @observable password = "";
  @observable cnhPicture = "";
  @observable aacPicture = "";

  @observable validations: TValidations = {
    terms: false,
    contact: false,
    code: false,
    cpf: false,
    birth: false,
    name: false,
    profilePicture: false,
    password: true,
    // docs: false,
  };

  birthDateObject?: Date;

  @action setLoading(state: boolean) {
    this.loading = state;
  }

  hashInvalidStep() {
    const invalidStep = Object.entries(this.validations).find(
      ([, state]) => !state,
    );

    if (!invalidStep) {
      return;
    }
    const [field] = invalidStep as [keyof TValidations, boolean];
    let screenName: RegisterScreens;

    if (field === "name" || field === "profilePicture") {
      screenName = "profile";
    } else if (field === "birth") {
      screenName = "cpf";
    } else {
      screenName = field;
    }

    return screenName;
  }

  next() {
    const invalidStep = this.hashInvalidStep();

    if (invalidStep) {
      return navigate(invalidStep);
    }

    return navigate("finish");
  }

  getContact() {
    return `${this.countryCode}${this.contact}`;
  }

  @action acceptTerms() {
    this.validations.terms = true;
    this.terms = true;
    navigate("contact");
  }

  @action validateContact(contact: string) {
    this.validations.contact = false;

    if (validator.isMobilePhone(`+55${contact}`, "pt-BR")) {
      this.validations.contact = true;
    }
  }

  @action async verify(contact: string) {
    try {
      const invalidField = this.hashInvalidStep();

      if (invalidField) {
        return navigate(invalidField);
      }

      if (!this.validations.contact || this.loading) {
        return;
      }

      if (
        this.contact === contact &&
        this.verificationIat &&
        this.resendSecondsLeft > 0
      )
        return this.next();

      this.loading = true;
      this.contact = contact;
      await register.verify(this.getContact());
      this.initiateVerificationResendCounter();

      this.next();
      // navigate("code");
    } catch (error) {
      this.exceptionHandler(error, "contact");
    } finally {
      console.log("??");
      this.loading = false;
    }
  }

  @action validateCode(code: string) {
    this.validations.code = false;

    if (code.length === 6) {
      this.validations.code = true;
    }
  }

  @action async checkContactVerification(code: string) {
    try {
      const invalidField = this.hashInvalidStep();

      if (invalidField) {
        return navigate(invalidField);
      }

      if (!this.validations.code || this.loading) {
        return;
      }

      this.loading = true;
      this.code = code;
      await register.check({
        contact: this.getContact(),
        code,
      });

      this.next();
      // navigate("cpf");
    } catch (error) {
      this.exceptionHandler(error, "code");
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

  @action async setProfilePicture(uri: string) {
    this.validations.profilePicture = false;
    this.errors.profilePicture = "";
    this.profielPicture = uri;

    const { faces } = await FaceDetector.detectFacesAsync(uri, {
      mode: FaceDetector.Constants.Mode.accurate,
    });

    if (faces.length !== 1) {
      this.errors.profilePicture = "Precisa ser uma foto do seu rosto";
      return;
    }

    return (this.validations.profilePicture = true);
  }

  @action setPassword(password: string, validate = false) {
    if (validate) {
      return (this.validations.password = true);
    }

    this.validations.password = false;

    this.password = password;

    const isValid = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\^\S]{5,}$/g.test(
      password,
    );

    if (isValid) {
      this.validations.password = true;
    }
  }

  /*
  @action setDocumentPicture(uri: string, type: "CNH" | "AAC") {
    const field = type === "CNH" ? "cnhPicture" : "aacPicture";

    this.validations.docs = false;

    this[field] = uri;

    if (this.cnhPicture && this.aacPicture) {
      this.validations.docs = true;
    }
  }
  */

  @action async finish() {
    try {
      this.loading = true;

      const registerObject: IUserRegisterDto = {
        contact: this.contact,
        code: this.code,
        firstName: this.firstName,
        lastName: this.lastName,
        cpf: this.cpf,
        terms: this.terms,
        birth: this.birth,
      };

      if (this.password) {
        registerObject.password = this.password;
      }

      await register.finish(registerObject);

      navigationRef.current?.addListener("beforeRemove", (e: any) => {
        e.preventDefault();
      });
    } catch (error) {
      this.exceptionHandler(error, "finish");
    } finally {
      this.loading = false;
      this.next();
    }
  }

  async exceptionHandler(error: Error, key: keyof ErrorsNamespaces) {
    if (error instanceof ky.HTTPError) {
      const content = (await error.response.json()) as IHttpException;
      console.log("c", content);
      this.errors[key] = ErrorMessages[content.message] || "Tente novamente";

      return;
    }

    this.snackContent = "Algo errado não esta certo, tente de novo.";
    this.snackVisible = true;

    setTimeout(() => {
      this.snackContent = "";
      this.snackVisible = false;
    }, 5000);
  }
}

export default new RegisterState();
