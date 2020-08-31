import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@app/cache";
import { ContactVerificationModule } from "@app/contact-verification";
import { DataModule } from "@app/data";
import { SessionModule } from "@app/session";
import { StorageModule } from "@app/storage";

import { FastifyAdapter } from "@nestjs/platform-fastify";
import { AuthController } from "../src/auth/auth.controller";
import { AuthService } from "../src/auth/auth.service";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const FastifyAdapterInstance = new FastifyAdapter();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".development.env",
        }),
        CacheModule,
        ContactVerificationModule,
        DataModule,
        SessionModule,
        StorageModule,
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication(FastifyAdapterInstance);
    await app.init();
  });
  /*
  it("/ (GET)", () => {
    return request(app.getHttpServer())
      .get("/")
      .expect(200)
      .expect("Hello World!");
  });*/
});
