/**
 * Helper: util
 *
 * @group unit/helpers/util
 */
import * as util from "./util";

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
        new Error(errorMsg),
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
