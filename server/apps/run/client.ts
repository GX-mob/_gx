import { parsers, auth } from "extensor";
import io from "socket.io-client";

import { schemas } from "./src/schemas/index";

const { parser } = parsers.schemapack(schemas);

const client = io("http://localhost:3001/voyagers", { parser } as any);

console.log("connecting");

client.on("connect", () => {
  console.log("connected");

  setInterval(() => {
    client.emit("state", { state: 1, id: "" });
  }, 1000);

  setTimeout(() => {
    auth.client(client, { token: "fooba" });
  }, 5000);
});
