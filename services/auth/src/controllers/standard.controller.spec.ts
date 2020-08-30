import { FastifyInstance } from "fastify";
import { configureControllerTest } from "fastify-decorators/testing";
import StandardController from "./standard.controller";

describe("Controller: Standard", () => {
  let instance: FastifyInstance;
  beforeAll(async () => {
    instance = await configureControllerTest({
      controller: StandardController,
    });
  });

  it("identify", async () => {
    const request = await instance.inject({
      url: "/id",
      method: "POST",
      payload: {},
    });

    console.log(request.body);
  });
});
