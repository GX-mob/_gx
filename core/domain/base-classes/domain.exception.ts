import { DomainExceptionsMessages } from "../exceptions/messages";

export class DomainException extends Error {
  constructor(readonly message: DomainExceptionsMessages, readonly code?: string){
    super(message);
  }
}