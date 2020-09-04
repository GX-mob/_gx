import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { UserModel } from "@app/database";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("AppController (e2e)", () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    process.env.DATABASE_URI = await mongoServer.getUri();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  it("/auth (GET) should response 404 user not found", () => {
    return request(app.getHttpServer()).get("/auth/a4234").expect(404);
  });

  it("/ (GET) should find the user", async () => {
    await UserModel.create({
      firstName: "First",
      lastName: "Last",
      cpf: "123.456.789-09",
      phones: ["+5582988888888"],
      emails: [],
      birth: new Date("06/13/1994"),
      pid: "1321312",
      averageEvaluation: 0,
      password: Buffer.from("foo"),
    });

    const req = request(app.getHttpServer())
      .get("/auth/+5582988888888")
      .expect(200);
  });
});
