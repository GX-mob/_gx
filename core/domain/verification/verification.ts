import { VerificationBase } from "./verification.base";
import { IVerification } from "./verification.types";

export class Verification extends VerificationBase {
  constructor(protected data: IVerification) {
    super(data);
  }
}
