/**
 * Ride model
 *
 * @group unit/services/database/models/ride
 */
import { RideModel } from "./ride";

describe("Model: Ride", () => {
  const mockRoutePoint = {
    coord: [1.23432, 2.31451],
    primary: "Rua Alcino Galvão 49",
    secondary: "Clima bom, Maceió",
  };

  const mockRoute = {
    start: mockRoutePoint,
    path: "...",
    end: mockRoutePoint,
    distance: 3400,
  };

  let base = {
    voyager: "507f1f77bcf86cd799439011",
    type: 1,
    payMethod: 1,
  };

  it("should throw error due to empty required fields", (done) => {
    const ride = new RideModel();

    ride.validate((err) => {
      expect(Object.keys(err.errors).length).toBe(4);
      done();
    });
  });

  it("should validate", () => {
    const ride = new RideModel({ ...base, route: mockRoute });

    const err = ride.validateSync() as any;
    expect(err).toBe(undefined);
  });

  it("should throw error due to empty route property", () => {
    const ride = new RideModel(base);

    const { errors } = ride.validateSync() as any;

    expect(errors.route.message).toBe("Path `route` is required.");
  });

  it("should throw error due to a non-object-type of route", () => {
    const ride = new RideModel({ ...base, route: [] });

    const { errors } = ride.validateSync() as any;

    expect(errors.route.reason.message).toBe(
      'Route must be an object with "start", "path", "end" and "distance" props',
    );
  });

  it("should throw error due to an empty object of route", () => {
    const ride = new RideModel({ ...base, route: {} });

    const { errors } = ride.validateSync() as any;

    expect(errors.route.reason.message).toBe(
      'Route must be an object with "start", "path", "end" and "distance" props',
    );
  });

  it("should throw error due to an invalid properties of route object", () => {
    const ride = new RideModel({
      ...base,
      route: { _: "", __: "", ___: "" },
    });

    const { errors } = ride.validateSync() as any;

    expect(errors.route.reason.message).toBe(
      'Route object must have "start", "path", "end" and "distance" props',
    );
  });

  it("should throw error due to an invalid path", () => {
    const ride = new RideModel({
      ...base,
      route: { start: "", path: 123, end: "", distance: 3400 },
    });

    const { errors } = ride.validateSync() as any;

    expect(errors.route.reason.message).toBe(
      "Path must be an encoded polyline, like as string.",
    );
  });

  it("should throw error due to an invalid route points", () => {
    const start = new RideModel({
      ...base,
      route: { start: "", path: "", end: "", distance: 3400 },
    }) as any;

    const end = new RideModel({
      ...base,
      route: { start: mockRoutePoint, path: "", end: "", distance: 3400 },
    }) as any;

    const distance = new RideModel({
      ...base,
      route: { start: "", path: "", end: "", distance: "" },
    }) as any;

    const checkpoint = new RideModel({
      ...base,
      route: {
        start: mockRoutePoint,
        path: "",
        end: mockRoutePoint,
        distance: 3400,
        waypoints: [{}],
      },
    }) as any;

    expect(start.validateSync().errors.route.reason.message).toBe(
      '"start" object must have "coord", "primary" and "secondary" props',
    );

    expect(end.validateSync().errors.route.reason.message).toBe(
      '"end" object must have "coord", "primary" and "secondary" props',
    );

    expect(checkpoint.validateSync().errors.route.reason.message).toBe(
      '"waypoints[0]" object must have "coord", "primary" and "secondary" props',
    );

    expect(distance.validateSync().errors.route.reason.message).toBe(
      "Distance must be a number",
    );
  });
});
