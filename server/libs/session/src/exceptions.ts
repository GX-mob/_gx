import { UnauthorizedException } from "@nestjs/common";
import { EXCEPTIONS } from "./constants";

export class SessionNotFoundException extends UnauthorizedException {
  constructor() {
    super(EXCEPTIONS.SESSION_NOT_FOUND);
  }
}

export class SessionDeactivatedException extends UnauthorizedException {
  constructor() {
    super(EXCEPTIONS.SESSION_DEACTIVATED);
  }
}
