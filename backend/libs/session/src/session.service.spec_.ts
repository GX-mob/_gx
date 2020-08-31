import { Test, TestingModule } from "@nestjs/testing";
import { DataModule } from "@app/data";
import { CacheModule } from "@app/cache";
import { SessionService } from "./session.service";

describe("SessionService", () => {
  let service: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DataModule, CacheModule],
      providers: [SessionService],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
