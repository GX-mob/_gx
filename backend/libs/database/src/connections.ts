import { createConnection, Connection } from "mongoose";

function makeConnection(database: string, connPool?: Connection): Connection {
  const connection = connPool ? connPool.useDb(database) : createConnection();
  return connection;
}

const Users = makeConnection("users");
const Rides = makeConnection("rides", Users);
const Sessions = makeConnection("sessions", Users);

export default {
  Users,
  Rides,
  Sessions,
};
