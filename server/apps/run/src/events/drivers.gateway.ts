import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { NAMESPACES } from "../constants";
import { Common } from "./common";
import { USERS_ROLES } from "@app/database";

@WebSocketGateway({ namespace: NAMESPACES.DRIVERS })
export class DriversGateway extends Common {
  public role = USERS_ROLES.DRIVER;
}
