import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import Connections, { createConnectionLogger } from "./connections";
export * as Models from "./models";
export { Connections };

export const options = {
  useNewUrlParser: true,
  keepAlive: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== "production",
};

export const connect = (databaseURI: string) => {
  return Promise.all([
    Connections.Users.openUri(databaseURI, options),
    Connections.Sessions,
    Connections.Rides,
  ]);
};

/**
 * Graceful databases disconnection
 */
export const disconnect = () => {
  return Promise.all([
    Connections.Users.close(),
    Connections.Sessions.close(),
    Connections.Rides.close(),
  ]);
};

const DatabaseConnections: FastifyPluginAsync = async () => {
  createConnectionLogger("users", Connections.Users);
  createConnectionLogger("sessions", Connections.Sessions);
  createConnectionLogger("rides", Connections.Rides);

  await connect(process.env.DATABASE_URI as string);
};

export default fp(DatabaseConnections);
