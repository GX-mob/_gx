import { IAccount } from "../account";

export enum EVehicleTypes {
  HATCH = "HATCH",
  SEDAN = "SEDAN",
}

export interface IVehicleMetadata {
  name: string;
  manufacturer: string;
  type: EVehicleTypes;
}

export interface IVehicleUsagePermissions {
  userId: string;
  expiration: number;
}

export interface IVehicle<UserType = IAccount, MetadataType = IVehicleMetadata> {
  _id: any;
  owner: UserType;
  plate: string;
  year: number;
  inUse: boolean;
  metadata: MetadataType;
  permissions: IVehicleUsagePermissions[];
  verificationId: string;
}

export type TVehicleCreate<
  UserType = IAccount,
  MetadataType = IVehicleMetadata
> = Pick<IVehicle<UserType, MetadataType>, "plate" | "year" | "metadata">;
