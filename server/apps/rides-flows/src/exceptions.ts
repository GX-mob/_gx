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

export class VehicleNotFoundException extends WsException {
  constructor(vehicleID: string) {
    super({ error: EXCEPTIONS.VEHICLE_NOT_FOUND, vehicleID });
  }
}
export class UncancelableRideException extends WsException {
  constructor(ridePID: string, cause: string) {
    super({ error: EXCEPTIONS.UNCANCELABLE_RIDE, ridePID, cause });
  }
}

export class NotInRideException extends WsException {
  constructor(ridePID: string, userPID: string) {
    super({ error: EXCEPTIONS.NOT_IN_RIDE, ridePID, userPID });
  }
}

export class TooDistantOfExpectedException extends WsException {
  constructor(point: string) {
    super({ message: EXCEPTIONS.TOO_DISTANT_OF_EXPECTED, point });
  }
}
