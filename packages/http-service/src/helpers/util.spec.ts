/**
 * Helpers
 *
 * @group unit/helpers
 */
import {
  parseContact,
  isValidContact,
  hashPassword,
  assertPassword,
} from "./util";

describe("Helper: util", () => {
  const validEmail = "foo@bar.com";
  const invalidEmail = "foo@barcom";
  const validPhone = {
    cc: "+55",
    number: "82988444444",
  };

  const invalidIDDCode = {
    cc: "s55",
    number: "d82988444444",
  };
  const invalidPhone = {
    cc: "+55",
    number: "829ij88444444",
  };

  it("Parse contact value", () => {
    const validateEmail = parseContact(validEmail);
    const invalidateEmail = parseContact(invalidEmail);
    const validatePhoneNumber = parseContact(validPhone);
    const invalidatePhoneNumber = parseContact(invalidPhone);
    const invalidateIDDCode = parseContact(invalidIDDCode);

    expect(validateEmail).toMatchObject({
      value: validEmail,
      field: "emails",
    });
    expect(invalidateEmail).toBe(false);
    expect(validatePhoneNumber).toMatchObject({
      value: "+5582988444444",
      field: "phones",
    });
    expect(invalidatePhoneNumber).toBe(false);
    expect(invalidateIDDCode).toBe(false);
  });

  it("Validate contacts", () => {
    expect(isValidContact(validEmail)).toBeTruthy();
    expect(isValidContact(validPhone)).toBeTruthy();
    expect(() => isValidContact(invalidEmail)).toThrow("invalid-contact");
    expect(() => isValidContact(invalidPhone)).toThrow("invalid-contact");
  });

  it("Assert password", async () => {
    const plain = "foo";
    const hash = await hashPassword(Buffer.from(plain));

    await expect(
      assertPassword(
        {
          value: plain,
          to: hash,
          be: true,
        },
        "don't throw"
      )
    ).resolves.toBe(undefined);

    await expect(
      assertPassword(
        {
          value: "wrong",
          to: hash,
          be: true,
        },
        "wrong"
      )
    ).rejects.toThrow("wrong");

    await expect(
      assertPassword(
        {
          value: plain,
          to: hash,
          be: false,
        },
        "don't throw its-equal"
      )
    ).rejects.toThrow("don't throw its-equal");

    await expect(
      assertPassword(
        {
          value: "bar",
          to: hash,
          be: false,
        },
        "don't throw its-diferent"
      )
    ).resolves.toBe(undefined);
  });
});
