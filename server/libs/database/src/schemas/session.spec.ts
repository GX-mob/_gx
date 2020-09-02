/**
 * Session model
 *
 * @group unit/services/database/models/session
 */
import { Types } from "mongoose";
import { SessionModel } from "./session";

describe("Model: Session", () => {
  const sessionMock = {
    user: new Types.ObjectId(),
    userAgent: "test",
  };

  it("should throw error due to empty required fields", (done) => {
    const session = new SessionModel();

    session.validate((err) => {
      expect(Object.keys(err.errors).length).toBe(2);
      done();
    });
  });

  it("should validate", () => {
    const session = new SessionModel({ ...sessionMock });

    const err = session.validateSync() as any;
    expect(err).toBe(undefined);
  });
});
