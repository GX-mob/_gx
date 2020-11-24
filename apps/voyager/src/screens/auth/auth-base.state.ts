import { observable } from "mobx";
import { VERIFICATION_RESEND_TIMEOUT } from "@/constants";

export class AuthBaseState {
  @observable resendSecondsLeft = 0;
  public verificationIat?: number;

  public hasPendentVerification() {
    return this.verificationIat && this.resendSecondsLeft > 0;
  }

  initiateVerificationResendCounter() {
    this.verificationIat = Date.now();
    this.resendSecondsLeft = this.calculateSecondsLeft(this.verificationIat);
    setTimeout(() => this.calculateVerificationResend(), 1000);
  }

  calculateSecondsLeft(iat: number) {
    return (
      Math.round(iat / 1000) +
      VERIFICATION_RESEND_TIMEOUT -
      Math.round(Date.now() / 1000)
    );
  }

  calculateVerificationResend() {
    this.resendSecondsLeft = this.calculateSecondsLeft(
      this.verificationIat as number,
    );

    this.resendSecondsLeft > 0 &&
      setTimeout(() => this.calculateVerificationResend(), 1000);
  }
}
