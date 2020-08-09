import fp from "fastify-plugin";
import { FastifyPlugin } from "fastify";
import Mongoose from "mongoose";

const DataBaseConnection: FastifyPlugin = async (instance, _opts) => {
  Mongoose.connection.on("connected", () => {
    instance.log.info({ actor: "MongoDB" }, "connected");
  });

  Mongoose.connection.on("disconnected", () => {
    instance.log.error({ actor: "MongoDB" }, "disconnected");
  });

  const MONGO_URI = process.env.MONGO_URI;

  await Mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    keepAlive: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    autoIndex: process.env.NODE_ENV !== "production",
  });
};

export default fp(DataBaseConnection);
