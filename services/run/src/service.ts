import { bootstrap } from "@gx-mob/http-service";
import { createServer } from "@gx-mob/socket.io-module";
import { parsers } from "extensor";
import { schemas } from "./schemas";
import Node from "./node";

const redis = process.env.REDIS_URI as string;

const service = bootstrap({
  redis,
});

const parser = parsers.schemapack(schemas);

const io = createServer(service.server, {
  redis,
  broadcastedEvents: ["setup", "position", "offerResponse", "configuration"],
  options: {
    parser,
  },
});

new Node(service.io, parser.schemas);

service.decorate("io", io);

export default service;
