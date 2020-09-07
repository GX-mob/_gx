/**
 * Helper: util
 *
 * @group unit/helpers/util
 */
import * as util from "./util";
import faker from "faker";
import SecurePassword from "secure-password";
import { UnprocessableEntityException } from "@nestjs/common";

const defer = (): {
  promise: Promise<unknown>;
  resolve: typeof Promise.resolve;
  reject: typeof Promise.reject;
} => {
  const defered: any = {};

  defered.promise = new Promise((resolve, reject) => {
    defered.resolve = resolve;
    defered.reject = reject;
  });

  return defered;
};

describe("Helper: util", () => {
  it("handleRejectionByUnderHood", async () => {
    const error = new Error("error");

    const defered = defer();
    const logger = { error: jest.fn() };

    util.handleRejectionByUnderHood(defered.promise, logger as any);

    defered.reject(error);

    // wait catch callback call
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(logger.error.mock.calls[0][0]).toStrictEqual(error);
  });

  describe("isValidContact", () => {
    it("validate contacts", () => {
      const email = faker.internet.email();
      const mobilePhone = "+5582988888888";

      expect(util.isValidContact(email)).toStrictEqual({
        field: "emails",
        value: email,
      });
      expect(util.isValidContact(mobilePhone)).toStrictEqual({
        field: "phones",
        value: mobilePhone,
      });
    });

    it('should throw UnprocessableEntityException("invalid-contact")', () => {
      const invalidMobilePhone = "+5588888";
      const invalidEmail = "âd@.com";

      expect(() => util.isValidContact(invalidMobilePhone)).toThrow(
        new UnprocessableEntityException("invalid-contact"),
      );

      expect(() => util.isValidContact(invalidEmail)).toThrow(
        new UnprocessableEntityException("invalid-contact"),
      );
    });
  });

  describe("hashPassword", () => {
    it("hash string", async () => {
      expect((await util.hashPassword("foo")) instanceof Buffer).toBeTruthy();
    });

    it("hash buffer", async () => {
      expect(
        (await util.hashPassword(Buffer.from("foo"))) instanceof Buffer,
      ).toBeTruthy();
    });
  });

  describe("assertPassword", () => {
    it("verify a valid password", async () => {
      const plainPassword = faker.internet.password();
      const hashedPassword = await util.hashPassword(plainPassword);

      expect(
        await util.assertPassword(plainPassword, hashedPassword),
      ).toBeTruthy();
    });

    it("verify a invalid password", async () => {
      const plainPassword = faker.internet.password();
      const diferentPassword = faker.internet.password();
      const hashedPassword = await util.hashPassword(plainPassword);

      expect(
        await util.assertPassword(diferentPassword, hashedPassword),
      ).toBeFalsy();
    });

    it("return password hehashed", async () => {
      const weakSecurePasswordInstance = new SecurePassword({
        memlimit: SecurePassword.MEMLIMIT_DEFAULT / 2,
        opslimit: SecurePassword.OPSLIMIT_DEFAULT / 2,
      });

      const plainPassword = faker.internet.password();
      const weakHash = await weakSecurePasswordInstance.hash(
        Buffer.from(plainPassword),
      );

      expect(
        (await util.assertPassword(plainPassword, weakHash)) instanceof Buffer,
      ).toBeTruthy();
    }, 100000);
  });

  describe("retry", () => {
    it("should resolve on first try", async () => {
      const resolvedValue = "foo";
      const promise: any = jest.fn();

      promise.mockResolvedValue(resolvedValue);

      await expect(util.retry(promise)).resolves.toBe(resolvedValue);
    });

    it("should resolve on second try", async () => {
      const resolvedValue = "foo";
      const promise: any = jest.fn();

      promise.mockRejectedValueOnce(new Error("any"));
      promise.mockResolvedValueOnce(resolvedValue);

      await expect(util.retry(promise)).resolves.toBe(resolvedValue);
    });

    it("should hit max retries", async () => {
      const promise: any = jest.fn();
      const maxRetrys = 2;
      const errorMsg = "any3";

      promise.mockRejectedValueOnce(new Error(errorMsg));
      promise.mockRejectedValueOnce(new Error(errorMsg));
      promise.mockRejectedValueOnce(new Error(errorMsg));

      await expect(util.retry(promise, maxRetrys)).rejects.toStrictEqual(
        new Error(
          `Max retries reached for function mockConstructor, last error: ${errorMsg}`,
        ),
      );
    });
  });

  describe("hasProp", () => {
    const obj = { foo: "bar" };
    const unsecureObj = { foo: "bar", hasOwnProperty: (prop: string) => true };

    it("should check over object", () => {
      expect(util.hasProp(obj, "foo")).toBeTruthy();
      expect(util.hasProp(obj, "bar")).toBeFalsy();
    });

    it("should check over unsecure object", () => {
      // direct call, false positive
      expect(unsecureObj.hasOwnProperty("not-have")).toBeTruthy();

      expect(util.hasProp(unsecureObj, "not-have")).toBeFalsy();
      expect(util.hasProp(unsecureObj, "hasOwnProperty")).toBeTruthy();
      expect(util.hasProp(unsecureObj, "foo")).toBeTruthy();
      expect(util.hasProp(unsecureObj, "bar")).toBeFalsy();
    });
  });

  describe("hideEmail", () => {
    const email = "valid@email.com";

    it("should hide", () => {
      expect(util.hideEmail(email)).toBe("val**@email.com");
    });

    it("should change default visible chars", () => {
      expect(util.hideEmail(email, 2)).toBe("va***@email.com");
    });

    it("should hide provider", () => {
      expect(util.hideEmail(email, 3, 2)).toBe("val**@em*******");
    });
  });

  describe("decimalAdjust", () => {
    const decimal1 = 1.2345123;
    const decimal2 = 2.6246456;
    const decimal3 = 3.3425212;
    const decimal4 = 4.1645212;

    it("round adjust", () => {
      expect(util.decimalAdjust(decimal1, -3)).toMatchSnapshot();
      expect(util.decimalAdjust(decimal2, -2)).toMatchSnapshot();
      expect(util.decimalAdjust(decimal3, -1)).toMatchSnapshot();
      expect(util.decimalAdjust(decimal4)).toMatchSnapshot();
    });

    it("floor adjust", () => {
      expect(util.decimalAdjust(decimal1, -3, "floor")).toMatchSnapshot();
      expect(util.decimalAdjust(decimal2, -2, "floor")).toMatchSnapshot();
      expect(util.decimalAdjust(decimal3, -1, "floor")).toMatchSnapshot();
      expect(util.decimalAdjust(decimal4, 0, "floor")).toMatchSnapshot();
    });

    it("ceil adjust", () => {
      expect(util.decimalAdjust(decimal1, -3, "ceil")).toMatchSnapshot();
      expect(util.decimalAdjust(decimal2, -2, "ceil")).toMatchSnapshot();
      expect(util.decimalAdjust(decimal3, -1, "ceil")).toMatchSnapshot();
      expect(util.decimalAdjust(decimal4, 0, "ceil")).toMatchSnapshot();
    });
  });
});
