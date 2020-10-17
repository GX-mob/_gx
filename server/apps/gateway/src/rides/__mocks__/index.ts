import {
  IRideAreaConfiguration,
  IRideTypeConfiguration,
} from "@shared/interfaces";
import { geometry } from "@app/helpers";
//@ts-ignore
const { decode } = require("google-polyline");

export const rideType1: IRideTypeConfiguration = {
  type: 1,
  available: true,
  perKilometer: 1.1,
  perMinute: 0.3,
  kilometerMultipler: 0.2,
  minuteMultipler: 0.1,
  overBusinessTimeKmAdd: 0.4,
  overBusinessTimeMinuteAdd: 0.3,
};

export const rideType2: IRideTypeConfiguration = {
  type: 2,
  available: true,
  perKilometer: 1.6,
  perMinute: 0.5,
  kilometerMultipler: 0.3,
  minuteMultipler: 0.2,
  overBusinessTimeKmAdd: 0.6,
  overBusinessTimeMinuteAdd: 0.5,
};

export const prices: IRideAreaConfiguration[] = [
  {
    area: "AL",
    currency: "BRL",
    timezone: "America/Maceio",
    general: [rideType1, rideType2],
    subAreas: {
      maceio: [rideType1, rideType2],
    },
  },
  {
    area: "PE",
    currency: "BRL",
    timezone: "America/Maceio",
    general: [rideType1, rideType2],
    subAreas: {
      recife: [rideType1, rideType2],
    },
  },
];

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
