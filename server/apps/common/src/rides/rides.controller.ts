import { Controller, UseGuards, Get } from "@nestjs/common";
import { AuthGuard, AuthorizedRequest } from "@app/auth";
import { DataService } from "@app/data";
import { RidesService } from "./rides.service";

@Controller("rides/")
@UseGuards(AuthGuard)
export class RidesController {
  constructor(readonly data: DataService, readonly rideService: RidesService) {}
}
