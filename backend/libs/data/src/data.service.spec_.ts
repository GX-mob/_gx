import { MongoMemoryServer } from "mongodb-memory-server";
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "@app/database";
import { CacheModule } from "@app/cache";
import { DataService } from "./data.service";

describe("DataService", () => {
  let mongoServer: MongoMemoryServer;
  let service: DataService;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    process.env.DATABASE_URI = await mongoServer.getUri();
  });

  afterAll(() => {
    mongoServer.stop();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, CacheModule],
      providers: [DataService],
    }).compile();

    service = module.get<DataService>(DataService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
