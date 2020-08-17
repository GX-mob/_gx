import { UserBasic } from "./user-basic";
import { Position } from "../events/position";
import { OfferRequest } from "../events/offer";

export type Configuration = {
  payMethods: OfferRequest["payMethod"][];
  types: OfferRequest["type"][];
};

export type Driver = UserBasic & { position: Position } & {
  config: Configuration;
};
