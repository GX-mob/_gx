/**
 * Contact Verification Service
 *
 * @group unit/services/contact-verification
 */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { ContactVerificationService } from "./contact-verification.service";
import { TwilioService } from "./twilio.service";

describe("ContactVerificationService", () => {
  let service: ContactVerificationService;
  const twilioService = {
    verify: {
      verifications: {
        create: jest.fn().mockResolvedValue({ sid: "VEXXXXXXXXXXXX" }),
      },
      verificationChecks: {
        create: jest.fn().mockResolvedValue({ status: "approved" }),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [TwilioService, ContactVerificationService],
    })
      .overrideProvider(TwilioService)
      .useValue(twilioService)
      .compile();

    service = module.get<ContactVerificationService>(
      ContactVerificationService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should throw a error due to invalid contact", async () => {
    await expect(service.request("foo@bar")).rejects.toThrow(
      "Verification target must be an email or mobile phone number",
    );

    await expect(service.request("+55")).rejects.toThrow(
      "Verification target must be an email or mobile phone number",
    );
  });

  it("should create a verification", async () => {
    const sid1 = await service.request("foo@bar.com");
    const sid2 = await service.request("+5582988888888");

    expect(sid1.startsWith("VE")).toBeTruthy();
    expect(sid2.startsWith("VE")).toBeTruthy();
  });

  it("should validate a verification", async () => {
    await expect(service.verify("foo@bar.com", "000000")).resolves.toBeTruthy();
  });
});
