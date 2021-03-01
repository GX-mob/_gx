import { DomainException } from "../base-classes/domain.exception";
import { DomainExceptionsMessages } from "../exceptions/messages";

export class UnsupportedAreaException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.UnsupportedArea);
  }
}

export class InvalidRideTypeException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.InvalidRideType);
  }
}