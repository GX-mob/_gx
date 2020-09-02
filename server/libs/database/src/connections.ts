import { createConnection, Connection } from "mongoose";

function makeConnection(database: string, connPool?: Connection): Connection {
  const connection = connPool ? connPool.useDb(database) : createConnection();
  return connection;
}

const Configuration = makeConnection("configuration");
const Users = makeConnection("users", Configuration);
const Rides = makeConnection("rides", Configuration);
const Sessions = makeConnection("sessions", Configuration);

export default {
  Configuration,
  Users,
  Rides,
  Sessions,
};
