import {
  UnprocessableEntityException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";

export class RideNotFoundException extends NotFoundException {}
export class InvalidRideTypeException extends UnprocessableEntityException {}
export class UnsupportedAreaException extends UnprocessableEntityException {}
export class RideNoReadPermission extends ForbiddenException {}
