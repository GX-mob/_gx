import {
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from "@nestjs/common";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.USER_NOT_FOUND);
  }
}

export class WrongPasswordException extends UnprocessableEntityException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.WRONG_PASSWORD);
  }
}

export class WrongVerificationCodeException extends UnprocessableEntityException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.WRONG_CODE);
  }
}

export class PhoneRegistredException extends ConflictException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.PHONE_REGISTRED);
  }
}

export class InvalidCPFException extends UnprocessableEntityException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.INVALID_CPF);
  }
}

export class CPFRegistredException extends ConflictException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.CPF_REGISTRED);
  }
}

export class TermsNotAcceptedException extends UnprocessableEntityException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.TERMS_NOT_ACCEPTED);
  }
}
