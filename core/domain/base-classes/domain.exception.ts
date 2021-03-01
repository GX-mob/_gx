import { DomainExceptionsMessages } from "../exceptions/messages";

export class DomainException extends Error {
  constructor(readonly message: DomainExceptionsMessages){
    super(message);
  }
}