import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { NAMESPACES } from "../constants";
import { Common } from "./common";
import { USERS_ROLES } from "@app/database";

@WebSocketGateway({ namespace: NAMESPACES.VOYAGERS })
export class VoyagersGateway extends Common {
  public role = USERS_ROLES.VOYAGER;

  @SubscribeMessage("identity")
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}
