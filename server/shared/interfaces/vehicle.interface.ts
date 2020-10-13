import { UserInterface } from "./user.interface";

export enum VehicleTypes {
  HATCH = "HATCH",
  SEDAN = "SEDAN",
}

export interface VehicleMetadataInterface {
  name: string;
  manufacturer: string;
  type: VehicleTypes;
}

export interface VehicleInterface {
  _id: any;
  plate: string;
  year: number;
  owner: UserInterface;
  inUse: boolean;
  metadata: VehicleMetadataInterface;
  permissions: { user: string; expiration: number }[];
}
