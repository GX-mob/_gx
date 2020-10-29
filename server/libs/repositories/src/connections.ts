import mongoose from "mongoose";
import { DATABASES } from "./constants";

mongoose.set("useCreateIndex", true);

function makeConnection(
  database: string,
  connPool?: mongoose.Connection,
): mongoose.Connection {
  const connection = connPool
    ? connPool.useDb(database)
    : mongoose.createConnection();
  return connection;
}

export const Configuration = makeConnection(DATABASES.CONFIGURATION);
export const Entities = makeConnection(DATABASES.ENTITIES, Configuration);
export const Operational = makeConnection(DATABASES.OPERATIONAL, Configuration);
export const Sessions = makeConnection(DATABASES.AUTHORIZATIONS, Configuration);

export const Connections = {
  Configuration,
  Entities,
  Operational,
  Sessions,
};
