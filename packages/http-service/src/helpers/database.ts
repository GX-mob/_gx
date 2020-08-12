/*
  GX - Corridas
  Copyright (C) 2020  Fernando Costa

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
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
