import {
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from "@nestjs/common";
import { HttpCommonExceptionsMessages } from "@core/exceptions-messages";

export class UserNotFoundHTTPException extends NotFoundException {}
export class WrongPasswordException extends UnprocessableEntityException {}
export class UnchangedPasswordException extends ConflictException {}

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super(HttpCommonExceptionsMessages.UserNotFound);
  }
}

export class ContactVerificationFailedException extends UnprocessableEntityException {
  constructor() {
    super(HttpCommonExceptionsMessages.ContactVerificationFailed);
  }
}

export class ContactRegistredException extends ConflictException {
  constructor() {
    super(HttpCommonExceptionsMessages.ContactAlreadyRegistred);
  }
}

export class FederalIdAlreadyRegistredException extends ConflictException {
  constructor() {
    super(HttpCommonExceptionsMessages.FederalIdAlreadyRegistred);
  }
}
