import { DomainBase } from "../base-classes/domain-base";
import { IVerification } from "./verification.types";

export class VerificationBase extends DomainBase<IVerification> {
  constructor(protected data: IVerification) {
    super(data);
  }

  public validate() {}
}
