import { SetMetadata } from "@nestjs/common";
import { EAccountRoles } from "@core/domain/account";
import { ROLES_METATADA_KEY } from "../constants";

export const Voyager = () =>
  SetMetadata(ROLES_METATADA_KEY, [EAccountRoles.Voyager]);
export const Driver = () => SetMetadata(ROLES_METATADA_KEY, [EAccountRoles.Driver]);
export const Roles = (...roles: EAccountRoles[]) =>
  SetMetadata(ROLES_METATADA_KEY, roles);
