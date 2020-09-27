import validator from "validator";
import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { TwilioService } from "./twilio.service";
import { CACHE_NAMESPACE, CACHE_TTL, VERIFIED_TTL } from "./constants";

@Injectable()
export class ContactVerificationService {
  constructor(private twilio: TwilioService, private cache: CacheService) {}
  /**
   * Request a contact verification
   * @param to Target to verify, can be an email or mobile phone number
   * @returns {Promise<number>} The issuance timestamp
   */
  public async request(to: string): Promise<number> {
    if (process.env.NODE_ENV === "development") {
      return Date.now();
    }

    const previousRequest = await this.getCache(to);

    if (previousRequest) {
      return previousRequest;
    }

    const channel = this.checkChannel(to);

    await this.twilio.verify.verifications.create({
      to,
      channel,
    });

    const iat = Date.now();

    await this.setCache(to, iat);

    return iat;
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

    const cached = await this.getCache(`${target}:${code}`);

    if (cached === true) {
      return true;
    }

    const { status } = await this.twilio.verify.verificationChecks.create({
      to: target,
      code,
    });

    const approved = status === "approved";

    if (approved) {
      await this.setCache(`${target}:${code}`, true, VERIFIED_TTL);
    }

    return approved;
  }

  private getCache(key: string) {
    return this.cache.get(CACHE_NAMESPACE, key);
  }

  private setCache(key: string, data: any, ttl = CACHE_TTL) {
    return this.cache.set(CACHE_NAMESPACE, key, data, { ex: ttl });
  }
}
