import { DomainExceptionsMessages } from "./messages";
import { DomainException } from "../base-classes/domain.exception";

export class InvalidContactException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.InvalidContactType);
  }
}
