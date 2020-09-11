import { WsException } from "@nestjs/websockets";
import { EXCEPTIONS } from "./constants";

export class ConnectionDataNotFoundException extends WsException {
  constructor(id: string) {
    super(`${EXCEPTIONS.CONNECTION_DATA_NOT_FOUND}: ${id}`);
  }
}

export class RideNotFoundException extends WsException {
  constructor(ridePID: string) {
    super(`${EXCEPTIONS.RIDE_NOT_FOUND}: ${ridePID}`);
  }
}
