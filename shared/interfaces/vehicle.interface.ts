import { UserInterface } from "./user.interface";

export enum VehicleTypes {
  HATCH = "HATCH",
  SEDAN = "SEDAN",
}

export interface VehicleModelInterface {
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
  vmodel: VehicleModelInterface;
  permissions: { user: string; expiration: number }[];
}
