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

export class UnchangedPasswordException extends ConflictException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.UNCHANGED_DATA);
  }
}

export class ContactVerificationFailedException extends UnprocessableEntityException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.CONTACT_VERIFICATION_FAILED);
  }
}

export class ContactRegistredException extends ConflictException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.CONTACT_ALREADY_REGISTRED);
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

export class PasswordRequiredException extends UnprocessableEntityException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.PASSWORD_REQUIRED);
  }
}

export class NotOwnContactException extends UnprocessableEntityException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.NOT_OWN_CONTACT);
  }
}

export class InvalidContactException extends UnprocessableEntityException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.INVALID_CONTACT);
  }
}

export class RemoveContactNotAllowed extends UnprocessableEntityException {
  constructor() {
    super(HTTP_EXCEPTIONS_MESSAGES.REMOVE_CONTACT_NOT_ALLOWED);
  }
}
