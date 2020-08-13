/**
 * GX - Corridas
 * Copyright (C) 2020  Fernando Costa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Service, Inject } from "fastify-decorators";
import Twilio from "twilio";
import { ServiceContext } from "twilio/lib/rest/verify/v2/service";
import { emailRegex, mobileNumberRegex } from "../../helpers/utils";

@Service()
export class TwilioService {
  public client: Twilio.Twilio;
  public verify: ServiceContext;

  /* istanbul ignore next */
  constructor() {
    const { TWILIO_ASID, TWILIO_TOKEN, TWILIO_EDGE, TWILIO_VSID } = process.env;

    this.client = Twilio(TWILIO_ASID, TWILIO_TOKEN, {
      edge: TWILIO_EDGE,
      lazyLoading: true,
    });

    this.verify = this.client.verify.services(TWILIO_VSID as string);
  }
}

// TODO cache verifications
@Service()
export class ContactVerificationService {
  @Inject(TwilioService)
  public twilio!: TwilioService;
  /**
   * Request a contact verification
   * @param to Target to verify, can be an email or mobile phone number
   * @returns {Promise<string>} The id of request
   */
  public async request(to: string): Promise<string> {
    const channel = this.checkChannel(to);

    const { sid } = await this.twilio.verify.verifications.create({
      to,
      channel,
    });

    return sid;
  }

  checkChannel(target: string): string {
    const emailVerify = emailRegex.test(target);

    if (!emailVerify && !mobileNumberRegex.test(target)) {
      throw new Error(
        "Verification target must be an email or mobile phone number"
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
    this.checkChannel(target);

    const { status } = await this.twilio.verify.verificationChecks.create({
      to: target,
      code,
    });

    return status === "approved";
  }
}
