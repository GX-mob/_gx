/**
 * Authentication/Authorization middleware
 *
 * @group unit/middlewares/auth
 */
import { FastifyInstance } from "fastify";
import {
  FastifyInstanceToken,
  Controller,
  GET,
  Hook,
} from "fastify-decorators";
import { configureControllerTest } from "fastify-decorators/testing";
import { SessionService, DataService } from "../services";
import { AuthMiddleware } from "./auth";
import { Types } from "mongoose";

const unauthorized = {
  statusCode: 401,
  error: "Unauthorized",
  message: "Unauthorized",
};

const forbidden = {
  statusCode: 403,
  error: "Forbidden",
  message: "Forbidden",
};

const internal = {
  statusCode: 500,
  error: "Internal Server Error",
  message: "Internal Server Error",
};

const authorized = { foo: "bar" };

@Controller("/")
class TestController extends AuthMiddleware {
  authSettings = {
    groups: [2],
  };

  @GET("/")
  async handler() {
    return authorized;
  }
}

describe("Middleware: Authentication/Authorization", () => {
  let instance: FastifyInstance;

  const id1 = Types.ObjectId("507f191e810c19729de860ea");
  const id2 = Types.ObjectId("507f191e810c19729de860eb");
  const userAgent = "test";
  const lastIp = "127.0.0.1";

  const fastifyInstanceMock = {
    log: {
      error: jest.fn(),
    },
  };
  const sessionServiceMock = {
    verify: jest.fn(),
    hasPermission: jest.fn(),
  };

  beforeAll(async () => {
    instance = await configureControllerTest({
      controller: TestController,
      mocks: [
        { provide: FastifyInstanceToken, useValue: fastifyInstanceMock },
        { provide: SessionService, useValue: sessionServiceMock },
        {
          provide: DataService,
          useValue: { users: { get: jest.fn().mockResolvedValue({}) } },
        },
      ],
    });
  });

  afterEach(() => jest.resetAllMocks());

  it("should don't authorize", async () => {
    const response = await instance.inject({
      url: "/",
      method: "GET",
    });

    const body = JSON.parse(response.body);

    expect(body).toMatchObject(unauthorized);
  });

  it("should deny due to not have permission", async () => {
    sessionServiceMock.verify.mockResolvedValue({
      session: {
        _id: id1,
        user: id2,
        groups: [1],
        userAgent,
        lastIp,
        active: true,
      },
    });

    sessionServiceMock.hasPermission.mockReturnValue(false);

    const response = await instance.inject({
      url: "/",
      method: "GET",
      headers: {
        Authorization: "Bearer XXXXXXXXXXX",
      },
    });

    const body = JSON.parse(response.body);

    expect(body).toMatchObject(forbidden);
  });

  it("should authorize", async () => {
    sessionServiceMock.verify.mockResolvedValue({
      session: {
        _id: id1,
        user: id2,
        groups: [1],
        userAgent,
        lastIp,
        active: true,
      },
    });

    sessionServiceMock.hasPermission.mockReturnValue(true);

    const response = await instance.inject({
      url: "/",
      method: "GET",
      headers: {
        Authorization: "Bearer XXXXXXXXXXX",
      },
    });

    const body = JSON.parse(response.body);

    expect(body).toMatchObject(authorized);
  });

  it("should not expose internal errors", async () => {
    sessionServiceMock.verify.mockRejectedValue(new Error("internal"));

    const response = await instance.inject({
      url: "/",
      method: "GET",
      headers: {
        Authorization: "Bearer XXXXXXXXXXX",
      },
    });

    const body = JSON.parse(response.body);

    expect(body).toMatchObject(internal);
    expect(fastifyInstanceMock.log.error.mock.calls.length).toBe(1);
  });

  it("should response with error due to not found/deactivated session", async () => {
    sessionServiceMock.verify
      .mockResolvedValue({ error: "not-found" })
      .mockResolvedValue({ error: "deactivated" });

    const notFoundResponse = await instance.inject({
      url: "/",
      method: "GET",
      headers: {
        Authorization: "Bearer XXXXXXXXXXX",
      },
    });

    const deactivatedResponse = await instance.inject({
      url: "/",
      method: "GET",
      headers: {
        Authorization: "Bearer XXXXXXXXXXX",
      },
    });

    const deactivatedBody = JSON.parse(deactivatedResponse.body);

    expect(deactivatedBody).toMatchObject({
      ...unauthorized,
      message: "deactivated",
    });
  });
});
