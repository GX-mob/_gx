import validator from "validator";
import { ValueObject } from "../base-classes/value-object";
import { DomainExceptionsMessages } from "../exceptions/messages";
import { DomainException } from "../base-classes/domain.exception";

export type ContactTypes = "email" | "phone";
export class InvalidContactException extends DomainException {
  constructor() {
    super(DomainExceptionsMessages.InvalidContactType);
  }
}

export class ContactObject implements ValueObject<string> {
  private contactType!: ContactTypes;

  constructor(private _value: string) {
    this.validate();
  }

  public getType(): ContactTypes {
    return this.contactType;
  }

  public validate() {
    if (validator.isMobilePhone(this._value)) {
      this.contactType = "phone";
    }

    if (validator.isEmail(this._value)) {
      this.contactType = "email";
    }

    if (!this.contactType) throw new InvalidContactException();
  }

  public get value(): string {
    return this._value;
  }
}
