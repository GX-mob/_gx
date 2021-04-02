import { DomainException } from "../base-classes/domain.exception";
import { DomainExceptionsMessages } from "../exceptions/messages";

export enum ERouteExceptionCodes {
  EmptyField = "empty-field",
  InvalidField = "invalid-field"
}

export class IncompleteRouteDataException extends DomainException {
  constructor(code: ERouteExceptionCodes) {
    super(DomainExceptionsMessages.IncompleteRouteData, code);
  }
}

export class InvalidRoutePointException extends DomainException {
  constructor(code: ERouteExceptionCodes) {
    super(DomainExceptionsMessages.InvalidRoutePoint, code);
  }
}