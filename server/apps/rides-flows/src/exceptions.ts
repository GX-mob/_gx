import { WsException } from "@nestjs/websockets";
import { CommonExceptionsCodes } from "./constants";

export class ConnectionDataNotFoundException extends WsException {
  constructor(id: string) {
    super({ error: CommonExceptionsCodes.ConnectionDataNotFound, id });
  }
}

export class RideNotFoundException extends WsException {
  constructor() {
    super({ error: CommonExceptionsCodes.RideNotFound });
  }
}

export class OfferNotFoundException extends WsException {
  constructor(ridePID: string) {
    super({ ridePID, error: CommonExceptionsCodes.OfferNotFound });
  }
}

export class VehicleNotFoundException extends WsException {
  constructor(vehicleID: string) {
    super({ error: CommonExceptionsCodes.VehicleNotFound, vehicleID });
  }
}
export class UncancelableRideException extends WsException {
  constructor(ridePID: string, cause: string) {
    super({ error: CommonExceptionsCodes.UncancelableRide, ridePID, cause });
  }
}

export class NotInRideException extends WsException {
  constructor(ridePID: string, userPID: string) {
    super({ error: CommonExceptionsCodes.NotInRide, ridePID, userPID });
  }
}

export class TooDistantOfExpectedException extends WsException {
  constructor(point: string) {
    super({ message: CommonExceptionsCodes.TooDistantOfExpected, point });
  }
}
