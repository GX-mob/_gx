import { DomainExceptionsMessages } from "../exceptions/messages";

export class DomainException extends Error {
  constructor(public readonly message: DomainExceptionsMessages, public readonly code?: string){
    super(message);
  }
}