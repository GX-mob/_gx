import {
  IRideAreaConfiguration,
  IRideTypeConfiguration,
  RideTypes,
} from "@shared/interfaces";
import { geometry } from "@app/helpers";
//@ts-ignore
const { decode } = require("google-polyline");

export function mockRideTypeConfiguration(
  override?: Partial<IRideTypeConfiguration>,
) {
  const configuration: IRideTypeConfiguration = {
    type: RideTypes.Normal,
    available: true,
    perKilometer: 1.1,
    perMinute: 0.3,
    kilometerMultipler: 0.2,
    minuteMultipler: 0.1,
    overBusinessTimeKmAdd: 0.4,
    overBusinessTimeMinuteAdd: 0.3,
    ...override,
  };

  return configuration;
}

export function mockAreaConfiguration(
  override?: Partial<IRideAreaConfiguration>,
) {
  const rideType1 = mockRideTypeConfiguration();
  const rideType2 = mockRideTypeConfiguration({ type: RideTypes.VIG });

  const configuration: IRideAreaConfiguration = {
    area: "AL",
    currency: "BRL",
    longRideConditions: {
      distanceKm: 20,
      minutes: 30,
    },
    timezone: "America/Maceio",
    general: [rideType1, rideType2],
    subAreas: {
      maceio: [
        { ...rideType1, perMinute: 0.3 },
        { ...rideType2, perKilometer: 1.5 },
      ],
    },
    ...override,
  };

  return configuration;
}

export const pathEncodedMock =
  "_jn~Fh_}uOlIr@dNxCxIOxIgB|HmElEmE~BeI~BsHjAwIh@yHjAkLdDcHxCkDjCwBfFcApCIdDO~B?dDc@dD?";
export const pathDecodedMock = decode(pathEncodedMock);
export const pathDistance = geometry.distance.meterToKM(
  geometry.distance.path(pathDecodedMock),
);
export const pathDuration = 10;

export const path = {
  encoded: pathEncodedMock,
  decoded: pathDecodedMock,
  distance: pathDistance,
  duration: pathDuration,
};
