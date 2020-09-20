/**
 * @group unit/models/vehicle
 */
import { Types } from "mongoose";
import { VehicleModel } from "./vehicle";

describe("Model: Vehicle", () => {
  it("should throw errors due to empty required fields", () => {
    const vehicle = new VehicleModel();
    const { errors } = vehicle.validateSync() as any;

    expect(Object.keys(errors).length).toBe(4);
  });

  it("should validate", () => {
    const vehicle = new VehicleModel({
      plate: "ABCD-1234",
      year: 2012,
      vmodel: new Types.ObjectId(),
      owner: new Types.ObjectId(),
    });

    const error = vehicle.validateSync() as any;

    expect(error).toBeUndefined();
  });
});
