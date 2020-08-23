import { createConnection, Connection } from "mongoose";
import logger from "../helpers/logger";

function makeConnection(database: string, conn?: Connection): Connection {
  const connection = conn ? conn.useDb(database) : createConnection();
  return connection;
}

export function createConnectionLogger(
  database: string,
  connection: Connection
) {
  connection.on("connected", () => {
    logger.info({ actor: "MongoDB", database }, "connected");
  });

  connection.on("disconnected", () => {
    logger.warn({ actor: "MongoDB", database }, "disconnected");
  });
}

const Users = makeConnection("users");
const Rides = makeConnection("rides", Users);
const Sessions = makeConnection("sessions", Users);

export default {
  Users,
  Rides,
  Sessions,
};
