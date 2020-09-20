/**
 * @group unit/models/vehicle-model
 */
import { VehicleTypes } from "@shared/interfaces";
import { VehicleModelModel } from "./vehicle-model";

describe("Model: Vehicle", () => {
  it("should throw errors due to empty required fields", () => {
    const vehicle = new VehicleModelModel();
    const { errors } = vehicle.validateSync() as any;

    expect(Object.keys(errors).length).toBe(3);
  });

  it("should validate", () => {
    const vehicle = new VehicleModelModel({
      name: "Vehicle name",
      manufacturer: "Vehicle manufacturer",
      type: VehicleTypes.HATCH,
    });

    const errors = vehicle.validateSync() as any;

    expect(errors).toBeUndefined();
  });
});
