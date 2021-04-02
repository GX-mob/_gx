import { DomainException } from "../base-classes/domain.exception";
import { DomainExceptionsMessages } from "../exceptions/messages";

export class SessionDeactivatedException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.SessionDeactivated);
  }
}
