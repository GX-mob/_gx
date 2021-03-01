import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import { ValueObject } from "../base-classes/value-object";
import { EAvailableCountries, InvalidFederalIDException } from "../user";

type TFederalIDValidationFunction = (value: string) => boolean;
type TFederalIDsValidationFunctions = {
  [key in EAvailableCountries]: TFederalIDValidationFunction;
};

const federalIdsValidationFunctions: TFederalIDsValidationFunctions = {
  [EAvailableCountries.BR]: isValidCPF,
};

export class FederalIDObject implements ValueObject<string> {
  constructor(private _value: string, private country: EAvailableCountries) {
    this.validate();
  }

  public validate() {
    const validationFunction: TFederalIDValidationFunction =
      federalIdsValidationFunctions[this.country];

    if (!validationFunction(this._value)) {
      throw new InvalidFederalIDException();
    }
  }

  public get value(): string {
    return this._value;
  }
}
