/**
 * Session model
 *
 * @group unit/models/pendencie
 */
import { Types } from "mongoose";
import { PendencieModel } from "./pendencie";

describe("Model: Pendencie", () => {
  const pendencieMock = {
    ride: new Types.ObjectId(),
    issuer: new Types.ObjectId(),
    affected: new Types.ObjectId(),
    amount: 3,
  };

  it("should throw error due to empty required fields", (done) => {
    const session = new PendencieModel();

    session.validate((err) => {
      expect(Object.keys(err.errors).length).toBe(3);
      done();
    });
  });

  it("should validate", () => {
    const session = new PendencieModel({
      ...pendencieMock,
    });

    const err = session.validateSync() as any;
    expect(err).toBe(undefined);
  });
});
