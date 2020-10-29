/**
 * @group unit/models/vehicle-metadata
 */
import { VehicleTypes } from "@shared/interfaces";
import { VehicleMetadataModel } from "./vehicle-metadata";

describe("Model: Vehicle", () => {
  it("should throw errors due to empty required fields", () => {
    const vehicleMetadata = new VehicleMetadataModel();
    const { errors } = vehicleMetadata.validateSync() as any;

    expect(Object.keys(errors).length).toBe(3);
  });

  it("should validate", () => {
    const vehicleMetadata = new VehicleMetadataModel({
      name: "Vehicle name",
      manufacturer: "Vehicle manufacturer",
      type: VehicleTypes.HATCH,
    });

    const errors = vehicleMetadata.validateSync() as any;

    expect(errors).toBeUndefined();
  });
});
