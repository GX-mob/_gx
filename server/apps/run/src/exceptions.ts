import { WsException } from "@nestjs/websockets";
import { EXCEPTIONS } from "./constants";

export class ConnectionDataNotFoundException extends WsException {
  constructor(id: string) {
    super({ error: EXCEPTIONS.CONNECTION_DATA_NOT_FOUND, id });
  }
}

export class RideNotFoundException extends WsException {
  constructor() {
    super({ error: EXCEPTIONS.RIDE_NOT_FOUND });
  }
}

export class UncancelableRideException extends WsException {
  constructor(ridePID: string, cause: string) {
    super({ error: EXCEPTIONS.UNCANCELABLE_RIDE, ridePID, cause });
  }
}
