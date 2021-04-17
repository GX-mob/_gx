import { ConnectionOptions } from "mongoose";

export const DATABASES = {
  CONFIGURATION: "config",
  ENTITIES: "entities",
  OPERATIONAL: "operational",
  AUTHORIZATIONS: "auth",
};

export enum EDatabaseCollectionsNames {
  Accounts = "accounts",
  Verifications = "verifications",
  Sessions = "sessions",
  Vehicles = "vehicles",
  VehiclesMetadata = "vehicles_metadata",
  Rides = "rides",
  AreasConfigurations = "areas_configurations",
}

export const CONNECTION_OPTIONS: ConnectionOptions = {
  useNewUrlParser: true,
  keepAlive: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== "production",
};
