import { AvailableCountries } from "../../interfaces";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import { ValueObject } from "../base-classes/value-object";
import { InvalidFederalIDException } from "../user/user.exceptions";

type TFederalIDValidationFunction = (value: string) => boolean;
type TFederalIDsValidationFunctions = {
  [key in AvailableCountries]: TFederalIDValidationFunction
}

const federalIdsValidationFunctions: TFederalIDsValidationFunctions = {
  [AvailableCountries.BR]: isValidCPF
}

export class FederalIDObject implements ValueObject<string> {

  constructor(private _value: string, private country: AvailableCountries) {}

  public validate(){
    const validationFunction: TFederalIDValidationFunction = federalIdsValidationFunctions[this.country];

    if(!validationFunction(this._value)) {
      throw new InvalidFederalIDException();
    }

  }

  public get value(): string {
    return this._value;
  }
}