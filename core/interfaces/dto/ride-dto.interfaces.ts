import {
  IRide,
  IRideCreate,
} from "../../domain/ride";

export type TGetRideInfoDto = Pick<IRide, "pid">;
export type TGetRidePricesDto = Pick<IRide, "area" | "subArea">
export type TCreateRideDto = IRideCreate;
export type TCreatedRideDto = Pick<IRide, "pid" | "costs">;