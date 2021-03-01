import { SetMetadata } from "@nestjs/common";
import { EUserRoles } from "@core/domain/user";
import { ROLES_METATADA_KEY } from "../constants";

export const Voyager = () =>
  SetMetadata(ROLES_METATADA_KEY, [EUserRoles.Voyager]);
export const Driver = () => SetMetadata(ROLES_METATADA_KEY, [EUserRoles.Driver]);
export const Roles = (...roles: EUserRoles[]) =>
  SetMetadata(ROLES_METATADA_KEY, roles);
