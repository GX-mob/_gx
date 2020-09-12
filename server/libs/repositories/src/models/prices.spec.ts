/**
 * Session model
 *
 * @group unit/services/database/models/prices
 */
import { Types } from "mongoose";
import { PriceModel, PriceDetail } from "./prices";

describe("Model: Price", () => {
  it("should throw error due to empty required fields", (done) => {
    const price = new PriceModel();

    price.validate((err) => {
      expect(Object.keys(err.errors).length).toBe(4);
      done();
    });
  });

  it("should validate", () => {
    const rideType1: PriceDetail = {
      type: 1,
      available: true,
      perKilometer: 1.1,
      perMinute: 0.3,
      kilometerMultipler: 0.2,
      minuteMultipler: 0.1,
      overBusinessTimeKmAdd: 0.4,
      overBusinessTimeMinuteAdd: 0.3,
    };

    const rideType2: PriceDetail = {
      type: 2,
      available: true,
      perKilometer: 1.6,
      perMinute: 0.5,
      kilometerMultipler: 0.3,
      minuteMultipler: 0.2,
      overBusinessTimeKmAdd: 0.6,
      overBusinessTimeMinuteAdd: 0.5,
    };

    const price = new PriceModel({
      area: "AL",
      currency: "BRL",
      timezone: "America/Maceio",
      general: [rideType1, rideType2],
      subAreas: {
        maceio: [rideType1, rideType2],
      },
    });

    const err = price.validateSync() as any;
    expect(err).toBe(undefined);
  });
});
