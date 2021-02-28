import { SetMetadata } from "@nestjs/common";
import { EUserRoles } from "@core/interfaces";
import { ROLES_METATADA_KEY } from "../constants";

export const Voyager = () =>
  SetMetadata(ROLES_METATADA_KEY, [EUserRoles.VOYAGER]);
export const Driver = () => SetMetadata(ROLES_METATADA_KEY, [EUserRoles.DRIVER]);
export const Roles = (...roles: EUserRoles[]) =>
  SetMetadata(ROLES_METATADA_KEY, roles);
