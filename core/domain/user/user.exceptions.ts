import {
  DomainException
} from "../base-classes/domain.exception";
import { DomainExceptionsMessages } from "../exceptions/messages";

export class PasswordRequiredException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.PasswordRequired)
  }
}

export class NotOwnContactException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.NotOwnContact);
  }
}

export class WrongPasswordException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.WrongPassword);
  }
}

export class InvalidFederalIDException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.InvalidFederalID);
  }
}

export class UnchangedPasswordException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.UnchagedData);
  }
}

export class RemoveContactNotAllowed extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.RemoveContactNotAllowed);
  }
}
