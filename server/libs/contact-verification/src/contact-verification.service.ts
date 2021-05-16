import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { TwilioService } from "./twilio.service";
import { CACHE_NAMESPACE, CACHE_TTL, VERIFIED_TTL } from "./constants";
import { EContactTypes } from "@core/domain/value-objects/contact.value-object";

@Injectable()
export class ContactVerificationService {
  constructor(private twilio: TwilioService, private cache: CacheService) {}
  /**
   * Request a contact verification
   * @param to Target to verify, can be an email or mobile phone number
   * @returns {Promise<string>} Request verification id
   */
  public async request(to: string, type: EContactTypes): Promise<string> {
    if (process.env.NODE_ENV === "development") {
      return "";
    }

    const previousRequest = await this.getCache(to);

    if (previousRequest) {
      return previousRequest;
    }

    const { sid } = await this.twilio.verify.verifications.create({
      to,
      channel: type === EContactTypes.Email ? "email" : "sms",
    });

    const iat = new Date();

    await this.setCache(to, iat);

    return sid;
  }

  /**
   * Validate a code
   * @param target
   * @param type EContactType
   * @param code User provided code
   * @param code Request verification id
   * @return {Promise} Promise
   */
  public async validate(
    target: string,
    code: string,
    sid: string,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === "development") {
      if ("000000" === code) {
        return true;
      }

      return false;
    }

    const cached = await this.getCache(`${target}:${code}:${sid}`);

    if (cached === true) {
      return true;
    }

    const { status, sid: _sid } = await this.twilio.verify.verificationChecks.create({
      to: target,
      code,
    });

    const approved = status === "approved" && _sid === sid;

    if (approved) {
      await this.setCache(`${target}:${code}:${_sid}`, true, VERIFIED_TTL);
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
