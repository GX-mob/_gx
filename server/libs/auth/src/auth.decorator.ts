import { SetMetadata } from "@nestjs/common";
import { UserRoles } from "@shared/interfaces";

export const Voyager = () => SetMetadata("roles", [UserRoles.VOYAGER]);
export const Driver = () => SetMetadata("roles", [UserRoles.DRIVER]);
export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
