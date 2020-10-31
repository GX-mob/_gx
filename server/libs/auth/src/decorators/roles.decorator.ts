import { SetMetadata } from "@nestjs/common";
import { UserRoles } from "@shared/interfaces";
import { ROLES_METATADA_KEY } from "../constants";

export const Voyager = () =>
  SetMetadata(ROLES_METATADA_KEY, [UserRoles.VOYAGER]);
export const Driver = () => SetMetadata(ROLES_METATADA_KEY, [UserRoles.DRIVER]);
export const Roles = (...roles: UserRoles[]) =>
  SetMetadata(ROLES_METATADA_KEY, roles);
