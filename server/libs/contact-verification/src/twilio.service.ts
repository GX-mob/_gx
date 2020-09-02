import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Twilio from "twilio";
import { ServiceContext } from "twilio/lib/rest/verify/v2/service";

@Injectable()
export class TwilioService {
  public client: Twilio.Twilio;
  public verify: ServiceContext;

  /* istanbul ignore next */
  constructor(
    private configService: ConfigService<{
      TWILIO_ASID: string;
      TWILIO_TOKEN: string;
      TWILIO_EDGE: string;
      TWILIO_VSID: string;
    }>,
  ) {
    const TWILIO_ASID = this.configService.get("TWILIO_ASID");
    const TWILIO_TOKEN = this.configService.get("TWILIO_TOKEN");
    const TWILIO_EDGE = this.configService.get("TWILIO_EDGE");
    const TWILIO_VSID = this.configService.get("TWILIO_VSID");

    this.client = Twilio(TWILIO_ASID, TWILIO_TOKEN, {
      edge: TWILIO_EDGE,
      lazyLoading: true,
    });

    this.verify = this.client.verify.services(TWILIO_VSID as string);
  }
}
