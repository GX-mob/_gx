import { createConnection } from "mongoose";

export default createConnection(
  process.env.URI_DATABASE_CONFIGURATION as string
);
