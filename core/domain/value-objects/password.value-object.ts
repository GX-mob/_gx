import SecurePassword from "secure-password";
import { ValueObject } from "../base-classes/value-object";
import { WrongPasswordException } from "../account/account.exceptions";

const securePassword = new SecurePassword();

type TEncoding = "utf8" | "base64";

export class PasswordObject implements ValueObject<string> {
  private buffer: Buffer;
  private _hash!: Buffer;

  public neededReHash = false;

  constructor(private rawValue: string, private encoding: TEncoding = "utf8") {
    this.validate();
    this.buffer = Buffer.from(this.rawValue, encoding);
  }

  validate() {
    if (!this.isRawPasswordBase64Hash() && this.rawValue.length < 6) {
      throw new Error("to short password");
    }
  }

  private isRawPasswordBase64Hash() {
    return this.encoding === "utf8";
  }

  public get value(): string {
    return this.toString();
  }

  public getRaw(): string {
    return this.rawValue;
  }

  public toString(encoding: TEncoding = this.encoding): string {
    return this.hash.toString(encoding);
  }

  public toBuffer(): Buffer {
    return this.buffer;
  }

  public async makeHash() {
    this._hash = await securePassword.hash(this.buffer);
  }

  public get hash(): Buffer {
    return this._hash;
  }

  public async compare(to: PasswordObject) {
    const comparativePasswordBuffer = to.toBuffer();

    const result = await securePassword.verify(
      comparativePasswordBuffer,
      this.hash,
    );

    switch (result) {
      case SecurePassword.VALID:
        return;
      case SecurePassword.VALID_NEEDS_REHASH:
        this.neededReHash = true;
        this._hash = await securePassword.hash(to.toBuffer());
        return;
      default:
        throw new WrongPasswordException();
    }
  }

  public async isEqual(to: Buffer) {
    const compareResult = await securePassword.verify(to, this._hash);

    return (
      compareResult === SecurePassword.VALID ||
      compareResult === SecurePassword.VALID_NEEDS_REHASH
    );
  }
}
