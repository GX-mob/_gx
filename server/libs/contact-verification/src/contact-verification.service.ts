import { Injectable } from "@nestjs/common";
import { TwilioService } from "./twilio.service";
import { util } from "@app/helpers";
import validator from "validator";

@Injectable()
export class ContactVerificationService {
  constructor(private twilio: TwilioService) {}
  /**
   * Request a contact verification
   * @param to Target to verify, can be an email or mobile phone number
   * @returns {Promise<string>} The id of request
   */
  public async request(to: string): Promise<string> {
    if (process.env.NODE_ENV === "development") {
      return "";
    }

    const channel = this.checkChannel(to);

    const { sid } = await this.twilio.verify.verifications.create({
      to,
      channel,
    });

    return sid;
  }

  checkChannel(target: string): string {
    const emailVerify = validator.isEmail(target);

    if (!emailVerify && !validator.isMobilePhone(target)) {
      throw new Error(
        "Verification target must be an email or mobile phone number",
      );
    }

    return emailVerify ? "email" : "sms";
  }

  /**
   * Validate a code
   * @param target
   * @param code user sent code
   * @return {Promise} Promise
   */
  public async verify(target: string, code: string): Promise<boolean> {
    if (process.env.NODE_ENV === "development") {
      if ("000000" === code) {
        return true;
      }

      return false;
    }

    this.checkChannel(target);

    const { status } = await this.twilio.verify.verificationChecks.create({
      to: target,
      code,
    });

    return status === "approved";
  }
}
