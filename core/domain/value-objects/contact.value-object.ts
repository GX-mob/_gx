import validator from "validator";
import { ValueObject } from "../base-classes/value-object";
import { InvalidContactException } from "../exceptions/invalid-contact.exception";

export type ContactTypes = "email" | "phone";

export class ContactObject implements ValueObject<string> {
  private contactType!: ContactTypes;

  constructor(private _value: string) {}

  public getType(): ContactTypes {
    return this.contactType;
  }

  public validate(){
    if (validator.isMobilePhone(this._value)) {
      this.contactType = "phone";
    }

    if (validator.isEmail(this._value)) {
      this.contactType = "email";
    }


    if(!this.contactType)
      throw new InvalidContactException();
  }

  public get value(): string {
    return this._value;
  }
}