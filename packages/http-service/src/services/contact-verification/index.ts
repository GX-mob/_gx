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

    this.verify = this.client.verify.services(TWILIO_VSID);
  }
}

// TODO cache verifications
@Service()
export class ContactVerificationService {
  @Inject(TwilioService)
  public twilio: TwilioService;
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
