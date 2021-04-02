import { ValueObject } from "../base-classes/value-object";

export class TermsVersionObject implements ValueObject<string> {
  constructor(private _value: string, private currentTermsVersion: string) {
    this.validate();
  }

  public validate() {}

  public get value(): string {
    return this._value;
  }
}
