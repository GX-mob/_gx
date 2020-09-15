import { parsers, auth } from "extensor";
import io from "socket.io-client";

import { EVENTS, serverEventsSchemas } from "./src/events";

const { parser } = parsers.schemapack(serverEventsSchemas);

const client = io("http://localhost:3001/voyagers", { parser } as any);

console.log("connecting");

client.on("connect", () => {
  console.log("connected");

  setInterval(() => {
    console.log("emit state");
    client.emit(EVENTS.STATE, { state: 1, id: "" });
  }, 3000);

  setTimeout(() => {
    auth.client(client, { token: "fooba" });
  }, 5000);
});
