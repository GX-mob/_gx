import { DomainExceptionsMessages } from "../exceptions/messages";

export interface SerializedException {
  message: string;
  stack?: string;
}

export class DomainException extends Error {
  constructor(readonly message: DomainExceptionsMessages){
    super(message);
  }

  toJSON(): SerializedException {
    return {
      message: this.message,
      stack: this.stack
    }
  }
}