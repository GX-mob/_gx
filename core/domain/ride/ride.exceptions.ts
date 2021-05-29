import { DomainException } from "../base-classes/domain.exception";
import { DomainExceptionsMessages } from "../exceptions/messages";

export enum ERouteExceptionsCodes {
  EmptyField = "empty-field",
  InvalidField = "invalid-field"
}

export class IncompleteRouteDataException extends DomainException {
  constructor(code: ERouteExceptionsCodes) {
    super(DomainExceptionsMessages.IncompleteRouteData, code);
  }
}

export class InvalidRoutePointException extends DomainException {
  constructor(code: ERouteExceptionsCodes) {
    super(DomainExceptionsMessages.InvalidRoutePoint, code);
  }
}