import { IUser } from "./user.interface";

export enum VehicleTypes {
  HATCH = "HATCH",
  SEDAN = "SEDAN",
}

export interface IVehicleMetadata {
  name: string;
  manufacturer: string;
  type: VehicleTypes;
}

export interface IVehicle {
  _id: any;
  plate: string;
  year: number;
  owner: IUser;
  inUse: boolean;
  metadata: IVehicleMetadata;
  permissions: { user: string; expiration: number }[];
}
