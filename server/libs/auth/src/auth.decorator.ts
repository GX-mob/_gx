import { SetMetadata } from "@nestjs/common";
import { USERS_ROLES } from "@app/repositories";

export const Voyager = () => SetMetadata("roles", [USERS_ROLES.VOYAGER]);
export const Driver = () => SetMetadata("roles", [USERS_ROLES.DRIVER]);
export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
