import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { ContactVerificationService } from "./contact-verification.service";

describe("ContactVerificationService", () => {
  let service: ContactVerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ContactVerificationService],
    }).compile();

    service = module.get<ContactVerificationService>(
      ContactVerificationService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
